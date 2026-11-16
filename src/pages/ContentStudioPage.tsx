import { useState } from 'react';

import {
  Copy,
  Globe,
  Hash,
  Calendar,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

import type { Project, ContentAsset, PlatformType } from '../types';
import { SAMPLE_CONTENT_ASSETS } from '../data/mockData';
import { useToast } from '../components/common/Toast';
import type { NavigationPage } from '../components/layout/Sidebar';


interface ContentStudioPageProps {
  project: Project;
  onNavigate: (page: NavigationPage) => void;
}

interface GenerateResponse {
  success: boolean;
  message: string;
  generated_content: string;
  hashtags: string[];
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const PLATFORM_LIMITS: Record<PlatformType, number> = {
  instagram: 2200,
  youtube: 5000,
  linkedin: 3000,
  twitter: 280,
};

export const ContentStudioPage = ({
  project,
  onNavigate,
}: ContentStudioPageProps) => {

  const { showToast } = useToast();

  const [selectedPlatform, setSelectedPlatform] =
    useState<PlatformType>('instagram');

  const [selectedLanguage, setSelectedLanguage] =
    useState<string>('English (US)');

  const [previewPlatform, setPreviewPlatform] =
    useState<'instagram' | 'youtube' | 'linkedin'>('instagram');

  const [assets, setAssets] =
    useState<Record<string, ContentAsset>>(SAMPLE_CONTENT_ASSETS);

  // AI Generator state
  const [contentIdea, setContentIdea] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);

  const currentAsset =
    assets[selectedPlatform] || assets.instagram;

  // Update caption
  const handleCaptionChange = (val: string) => {
    setAssets((prev) => ({
      ...prev,
      [selectedPlatform]: {
        ...prev[selectedPlatform],
        caption: val,
        characterCount: val.length,
      },
    }));
  };

  // Update title
  const handleTitleChange = (val: string) => {
    setAssets((prev) => ({
      ...prev,
      [selectedPlatform]: {
        ...prev[selectedPlatform],
        title: val,
      },
    }));
  };

  // Generate content using FastAPI + Gemini
  const handleGenerateContent = async () => {

    if (!contentIdea.trim()) {
      showToast(
        'Missing content idea',
        'Please enter a topic before generating.',
        'error'
      );
      return;
    }

    if (isGenerating) return;

    setIsGenerating(true);

    try {

      const prompt = `
Create a complete social media post using the following topic.

Topic: ${contentIdea}

Please generate exactly these sections:

POST TITLE:
Write one catchy and attention-grabbing title or hook.

CAPTION:
Write an engaging, informative and platform-appropriate caption.
Use natural language and relevant emojis where appropriate.
Include a clear call to action.

HASHTAGS:
Generate 5 relevant hashtags.

Target Platform: ${selectedPlatform}
Language: ${selectedLanguage}
Tone: Engaging and professional.

Make the content suitable for the target platform.
      `;

      const response = await fetch(
        `${API_BASE_URL}/api/content/generate`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            content: prompt,
            content_type: 'text',
            language: selectedLanguage,
            tone: 'engaging',
            platform: selectedPlatform,
          }),
        }
      );

      const data = await response.json() as GenerateResponse;

      if (!response.ok) {
        throw new Error(
          (data as unknown as { detail?: string }).detail ||
          data.message ||
          `Request failed with status ${response.status}`
        );
      }

      if (!data.success || !data.generated_content) {
        throw new Error(
          data.message || 'Content generation failed.'
        );
      }

      const generatedText = data.generated_content.trim();

      // Extract title from Gemini response
      const titleMatch = generatedText.match(
        /POST TITLE\s*:\s*([\s\S]*?)(?=\n\s*CAPTION\s*:|$)/i
      );

      // Extract caption
      const captionMatch = generatedText.match(
        /CAPTION\s*:\s*([\s\S]*?)(?=\n\s*HASHTAGS\s*:|$)/i
      );

      // Extract hashtags section
      const hashtagMatch = generatedText.match(
        /HASHTAGS\s*:\s*([\s\S]*?)$/i
      );

      const generatedTitle =
        titleMatch?.[1]?.trim() || currentAsset.title;

      const generatedCaption =
        captionMatch?.[1]?.trim() || generatedText;

      // Prefer backend extracted hashtags
      const extractedHashtags =
        Array.isArray(data.hashtags) && data.hashtags.length > 0
          ? data.hashtags
          : (
              hashtagMatch?.[1]?.match(/#[\w]+/g) ||
              generatedText.match(/#[\w]+/g) ||
              []
            );

      const uniqueHashtags = [...new Set(extractedHashtags)];

      // Update editor and live preview
      setAssets((prev) => ({
        ...prev,

        [selectedPlatform]: {
          ...prev[selectedPlatform],

          title: generatedTitle,

          caption: generatedCaption,

          characterCount: generatedCaption.length,

          hashtags: uniqueHashtags,
        },
      }));

      showToast(
        'Content generated successfully!',
        'Your AI-generated post is ready.',
        'success'
      );

    } catch (error) {

      console.error('Content generation error:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.';

      showToast(
        'Generation failed',
        errorMessage,
        'error'
      );

    } finally {

      setIsGenerating(false);

    }
  };


  // Copy caption and hashtags
  const handleCopyCaption = async () => {

    const fullText =
      `${currentAsset.title}\n\n${currentAsset.caption}\n\n${currentAsset.hashtags.join(' ')}`;

    try {
      await navigator.clipboard.writeText(fullText);

      showToast(
        'Copied to clipboard',
        'Caption and hashtags ready to paste.',
        'success'
      );

    } catch {
      showToast(
        'Copy failed',
        'Unable to access clipboard.',
        'error'
      );
    }
  };


  // Add hashtag
  const handleAddHashtag = (tag: string) => {

    if (!currentAsset.hashtags.includes(tag)) {

      setAssets((prev) => ({
        ...prev,

        [selectedPlatform]: {
          ...prev[selectedPlatform],

          hashtags: [
            ...prev[selectedPlatform].hashtags,
            tag,
          ],
        },
      }));

      showToast('Hashtag added', tag, 'info');
    }
  };


  // Remove hashtag
  const handleRemoveHashtag = (tagToRemove: string) => {

    setAssets((prev) => ({
      ...prev,

      [selectedPlatform]: {
        ...prev[selectedPlatform],

        hashtags: prev[selectedPlatform].hashtags.filter(
          (tag) => tag !== tagToRemove
        ),
      },
    }));
  };


  const charCount = currentAsset.caption.length;

  const limit = PLATFORM_LIMITS[selectedPlatform];

  const isNearLimit = charCount > limit * 0.9;

  const isOverLimit = charCount > limit;


  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E3DC]">

        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium mb-1">
            <span>Multi-Channel Copy & Captions Studio</span>
            <span>·</span>
            <span>AI-Powered Content Generation</span>
          </div>

          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Content Studio
          </h1>

          <p className="text-sm text-stone-600 mt-0.5">
            Generate, refine and preview platform-tailored content using AI.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">

          <button
            onClick={handleCopyCaption}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#721246] hover:bg-[#5c0e38] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Full Post
          </button>

          <button
            onClick={() => onNavigate('distribution')}
            className="flex items-center gap-2 px-4 py-2 bg-[#721246] text-white hover:bg-[#5c0e38] text-xs font-semibold rounded-lg"
          >
            Proceed to Distribution
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>


      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT SIDE */}
        <div className="lg:col-span-7 space-y-6">


          {/* Platform and Language */}
          <div className="bg-white rounded-xl p-4 border border-[#E7E3DC] shadow-xs flex flex-wrap items-center justify-between gap-3">

            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs font-medium">

              {(['instagram', 'youtube', 'linkedin', 'twitter'] as PlatformType[]).map(
                (plat) => (

                  <button
                    key={plat}
                    onClick={() => {
                      setSelectedPlatform(plat);

                      if (
                        plat === 'instagram' ||
                        plat === 'youtube' ||
                        plat === 'linkedin'
                      ) {
                        setPreviewPlatform(plat);
                      }
                    }}
                    className={`px-3 py-1.5 rounded capitalize transition-colors ${
                      selectedPlatform === plat
                        ? 'bg-[#721246] text-white shadow-xs font-semibold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {plat === 'twitter' ? 'X / Twitter' : plat}
                  </button>

                )
              )}

            </div>

            <div className="flex items-center gap-2 text-xs">

              <Globe className="w-3.5 h-3.5 text-stone-500" />

              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-stone-50 border border-stone-200 text-stone-800 rounded-md px-2 py-1"
              >
                <option value="English (US)">English (US)</option>
                <option value="Spanish (Español)">Spanish (Español)</option>
                <option value="French (Français)">French (Français)</option>
              </select>

            </div>

          </div>


          {/* AI Generator */}
          <div className="bg-white rounded-xl p-5 border border-[#E7E3DC] shadow-xs space-y-4">

            <div className="flex items-center gap-2">

              <div className="w-9 h-9 rounded-lg bg-[#F9EDF4] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#721246]" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  AI Content Generator
                </h3>

                <p className="text-xs text-stone-500">
                  Describe your idea and let Gemini create your post.
                </p>
              </div>

            </div>


            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
              What should we create?
            </label>

            <textarea
              rows={4}
              value={contentIdea}
              onChange={(e) => setContentIdea(e.target.value)}
              placeholder="Example: Create an Instagram post about how AI is transforming students' lives..."
              className="w-full p-3.5 text-sm text-stone-900 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#721246] focus:bg-white resize-y"
            />


            <button
              onClick={handleGenerateContent}
              disabled={isGenerating || !contentIdea.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#721246] hover:bg-[#5c0e38] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >

              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating your content...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </>
              )}

            </button>

            <p className="text-[11px] text-stone-400">
              Powered by Gemini AI · Text content generation
            </p>

          </div>


          {/* Post Title */}
          <div className="bg-white rounded-xl p-5 border border-[#E7E3DC] shadow-xs space-y-2">

            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
              Post Title / Header Hook
            </label>

            <input
              type="text"
              value={currentAsset.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-semibold text-stone-900 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 focus:bg-white"
              placeholder="Your catchy post title..."
            />

          </div>


          {/* Caption Editor */}
          <div className="bg-white rounded-xl p-5 border border-[#E7E3DC] shadow-xs space-y-3">

            <div className="flex items-center justify-between">

              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                Platform Caption & Description
              </label>

              <div className="flex items-center gap-1.5 text-xs font-mono">

                <span
                  className={`font-semibold ${
                    isOverLimit
                      ? 'text-rose-600'
                      : isNearLimit
                      ? 'text-amber-600'
                      : 'text-stone-500'
                  }`}
                >
                  {charCount}
                </span>

                <span className="text-stone-400">/</span>

                <span className="text-stone-400">
                  {limit}
                </span>

                {isOverLimit && (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                )}

              </div>

            </div>

            <textarea
              rows={9}
              value={currentAsset.caption}
              onChange={(e) => handleCaptionChange(e.target.value)}
              className="w-full p-3.5 text-xs text-stone-900 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 focus:bg-white leading-relaxed resize-y"
              placeholder="Your generated caption will appear here..."
            />

            <div className="flex items-center justify-between text-xs text-stone-500 pt-1">

              <span>
                Optimized for audience engagement
              </span>

              <button
                onClick={handleCopyCaption}
                className="text-stone-800 hover:text-stone-950 font-semibold flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy Caption
              </button>

            </div>

          </div>


          {/* Hashtags */}
          <div className="bg-white rounded-xl p-5 border border-[#E7E3DC] shadow-xs space-y-3">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-1.5">

                <Hash className="w-4 h-4 text-stone-500" />

                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Targeted Hashtags
                </h3>

              </div>

              <span className="text-xs text-stone-500 font-mono">
                {currentAsset.hashtags.length} tags attached
              </span>

            </div>


            <div className="flex flex-wrap gap-2">

              {currentAsset.hashtags.map((tag) => (

                <span
                  key={tag}
                  onClick={() => handleRemoveHashtag(tag)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 text-xs rounded-md font-mono cursor-pointer"
                  title="Click to remove tag"
                >
                  {tag}
                  <span className="text-stone-400">×</span>
                </span>

              ))}

            </div>


            <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2 text-xs">

              <span className="text-stone-400 text-[11px]">
                Quick Add:
              </span>

              {[
                '#Solopreneur',
                '#IndieHacker',
                '#BuildInPublic',
                '#FastAPI',
              ].map((tag) => (

                <button
                  key={tag}
                  onClick={() => handleAddHashtag(tag)}
                  className="text-stone-600 hover:text-stone-900 hover:underline font-mono text-[11px]"
                >
                  +{tag}
                </button>

              ))}

            </div>

          </div>

        </div>


        {/* RIGHT SIDE - LIVE PREVIEW */}
        <div className="lg:col-span-5 space-y-4">

          <div className="bg-white rounded-xl p-5 border border-[#E7E3DC] shadow-xs space-y-4">

            <div className="flex items-center justify-between">

              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Live Channel Preview
                </h3>

                <p className="text-xs text-stone-500">
                  Native UI appearance simulation
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs">

                {(['instagram', 'youtube', 'linkedin'] as const).map(
                  (channel) => (

                    <button
                      key={channel}
                      onClick={() => setPreviewPlatform(channel)}
                      className={`px-2.5 py-1 rounded capitalize ${
                        previewPlatform === channel
                          ? 'bg-[#721246] text-white font-semibold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {channel}
                    </button>

                  )
                )}

              </div>

            </div>


            <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50 p-4">

              {/* INSTAGRAM */}
              {previewPlatform === 'instagram' && (

                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">

                  <div className="p-3 flex items-center justify-between border-b border-stone-100">

                    <div className="flex items-center gap-2.5">

                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-[10px] text-stone-800">
                          RS
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-stone-900">
                          rahulseth_builds
                        </p>

                        <p className="text-[10px] text-stone-400">
                          Audio · Original sound
                        </p>
                      </div>

                    </div>

                    <span className="text-stone-400 font-bold">
                      ···
                    </span>

                  </div>


                  <div className="aspect-square bg-stone-900 flex flex-col items-center justify-center text-white p-6 text-center">

                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2">
                      <Sparkles className="w-6 h-6 text-amber-400" />
                    </div>

                    <p className="text-sm font-bold uppercase tracking-wide text-amber-300">
                      {currentAsset.title}
                    </p>

                    <p className="text-xs text-stone-300 mt-1">
                      1 Video → 4 Vertical Clips
                    </p>

                  </div>

                  <div className="p-3.5 space-y-2 text-xs">

                    <div className="flex items-center justify-between text-stone-700">
                      <div className="flex items-center gap-3">
                        <span>❤️ 1,248</span>
                        <span>💬 84</span>
                        <span>↗️ 210</span>
                      </div>
                      <span>🔖</span>
                    </div>

                    <div className="space-y-1">

                      <p className="text-stone-900 whitespace-pre-line text-[11px] leading-relaxed">
                        <span className="font-bold mr-1.5">
                          rahulseth_builds
                        </span>
                        {currentAsset.caption}
                      </p>

                      <p className="text-[11px] text-blue-800 font-mono">
                        {currentAsset.hashtags.join(' ')}
                      </p>

                    </div>

                  </div>

                </div>

              )}

              {/* YOUTUBE */}
              {previewPlatform === 'youtube' && (

                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs p-4 space-y-3">

                  <div className="aspect-video bg-stone-900 rounded-lg flex items-center justify-center text-white text-xs">
                    [YouTube 16:9 Video Canvas]
                  </div>

                  <div>

                    <h4 className="text-sm font-bold text-stone-900 leading-snug">
                      {currentAsset.title}
                    </h4>

                    <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-1">
                      <span>42K views</span>
                      <span>·</span>
                      <span>2 days ago</span>
                    </div>

                  </div>

                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-700 whitespace-pre-line leading-relaxed">
                    {currentAsset.caption}
                  </div>

                  <p className="text-xs text-blue-700 font-mono">
                    {currentAsset.hashtags.join(' ')}
                  </p>

                </div>

              )}

              {/* LINKEDIN */}
              {previewPlatform === 'linkedin' && (

                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs p-4 space-y-3">

                  <div className="flex items-start gap-2.5">

                    <div className="w-10 h-10 rounded-full bg-stone-800 text-white font-bold flex items-center justify-center text-xs">
                      RS
                    </div>

                    <div>
                      <p className="text-xs font-bold text-stone-900">
                        Rahul Seth
                      </p>

                      <p className="text-[10px] text-stone-500">
                        Solo Founder · Building CreatorPilot AI
                      </p>

                      <p className="text-[9px] text-stone-400">
                        1h · Edited · 🌐
                      </p>
                    </div>

                  </div>

                  <div className="text-xs text-stone-800 whitespace-pre-line leading-relaxed">
                    <p className="font-bold mb-2">
                      {currentAsset.title}
                    </p>
                    {currentAsset.caption}
                  </div>

                  <div className="text-xs text-blue-700 font-medium">
                    {currentAsset.hashtags.join(' ')}
                    </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-stone-500 text-xs">
                    <span>👍 418 reactions</span>
                    <span>💬 62 comments</span>
                  </div>

                </div>

              )}

            </div>


            {/* Distribution */}
            <button
              onClick={() => onNavigate('distribution')}
              className="w-full py-2.5 bg-[#721246] text-white hover:bg-[#5c0e38] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Schedule in Distribution Calendar
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};