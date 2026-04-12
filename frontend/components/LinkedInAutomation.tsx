'use client';

import React, { useState, useEffect } from 'react';
import {
  linkedinLogin,
  runLinkedinBot,
  checkLinkedinSession,
  fetchReviewPosts,
  generateComments,
  applyPostAction,
  LinkedInPost,
} from '@/lib/api';

const LinkedInAutomation: React.FC = () => {
  // States
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentTone, setCurrentTone] = useState('balanced');
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [refinementText, setRefinementText] = useState<{ [key: number]: string }>({});
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await checkLinkedinSession();
      setSessionActive(res.status !== 'error');
    } catch {
      setSessionActive(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await linkedinLogin();
      setMessage({ type: 'success', text: 'LinkedIn login successful.' });
      await checkSession();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Login failed: ${error?.response?.data?.error || error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunBot = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await runLinkedinBot();
      setMessage({ type: 'success', text: 'Bot completed. Fetching posts...' });
      await loadReviewPosts();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Bot failed: ${error?.response?.data?.error || error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateComments = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const generatedPosts = await generateComments(currentTone);
      setPosts(generatedPosts);
      setMessage({
        type: 'success',
        text: `Generated comments (tone: ${currentTone}) for ${generatedPosts.length} posts.`,
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Comment generation failed: ${
          error?.response?.data?.error || error.message
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReviewPosts = async () => {
    try {
      const fetchedPosts = await fetchReviewPosts();
      setPosts(fetchedPosts);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Failed to fetch posts: ${error?.response?.data?.error || error.message}`,
      });
    }
  };

  const handleApprove = async (postId: number) => {
    setLoading(true);
    try {
      const updated = await applyPostAction(postId, 'approve');
      setPosts(updated);
      setMessage({ type: 'success', text: 'Comment approved.' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Approval failed: ${error?.response?.data?.error || error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (postId: number) => {
    setLoading(true);
    try {
      const updated = await applyPostAction(postId, 'reject');
      setPosts(updated);
      setMessage({ type: 'success', text: 'Post rejected.' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Rejection failed: ${error?.response?.data?.error || error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async (postId: number) => {
    const refinedComment = refinementText[postId];
    if (!refinedComment?.trim()) {
      setMessage({
        type: 'error',
        text: 'Please enter refinement feedback.',
      });
      return;
    }

    setLoading(true);
    try {
      const updated = await applyPostAction(
        postId,
        'refine',
        refinedComment,
        currentTone
      );
      setPosts(updated);
      setRefinementText({ ...refinementText, [postId]: '' });
      setMessage({ type: 'success', text: 'Comment refined.' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Refinement failed: ${error?.response?.data?.error || error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          LinkedIn Comment Automation
        </h1>
        <p className="text-blue-200">
          Auto-generate and post comments on LinkedIn posts with AI-powered engagement
        </p>
      </div>

      {/* Session Status */}
      <div className="max-w-6xl mx-auto mb-6">
        <div
          className={`p-4 rounded-lg border ${
            sessionActive
              ? 'bg-green-950 border-green-500'
              : 'bg-red-950 border-red-500'
          }`}
        >
          <p className={sessionActive ? 'text-green-200' : 'text-red-200'}>
            {sessionActive ? 'Active LinkedIn Session' : 'No Active LinkedIn Session'}
          </p>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className="max-w-6xl mx-auto mb-6">
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-900 text-green-200 border border-green-700'
                : 'bg-red-900 text-red-200 border border-red-700'
            }`}
          >
            {message.text}
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Automation Controls</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-black font-semibold py-2 px-4 rounded-lg transition"
            >
              Login to LinkedIn
            </button>

            {/* Run Bot Button */}
            <button
              onClick={handleRunBot}
              disabled={loading || !sessionActive}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Run Bot (Scrape Posts)
            </button>

            {/* Tone Selection + Generate */}
            <div className="flex gap-2">
              <select
                value={currentTone}
                onChange={(e) => setCurrentTone(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
              >
                <option value="balanced">Balanced</option>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="engaging">Engaging</option>
                <option value="insightful">Insightful</option>
              </select>

              <button
                onClick={handleGenerateComments}
                disabled={loading}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Generate Comments
              </button>
            </div>

            {/* Reload Posts */}
            <button
              onClick={loadReviewPosts}
              disabled={loading}
              className="bg-slate-600 hover:bg-slate-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Reload Posts
            </button>
          </div>
        </div>
      </div>

      {/* Posts Review Section */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Review and Approve Posts</h2>

        {posts.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <p className="text-slate-400">
              Run the bot first to scrape LinkedIn posts, then generate comments.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition"
              >
                {/* Post Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {post.author}
                    </h3>
                    <p className="text-slate-300 text-sm mb-2">{post.text}</p>
                    {post.url && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 text-sm"
                      >
                        View Author Profile
                      </a>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      post.status === 'approved'
                        ? 'bg-green-900 text-green-200'
                        : post.status === 'rejected'
                        ? 'bg-red-900 text-red-200'
                        : 'bg-yellow-900 text-yellow-200'
                    }`}
                  >
                    {post.status.toUpperCase()}
                  </span>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="text-slate-400">
                    <span className="font-semibold">Category:</span> {post.llm_category || 'N/A'}
                  </div>
                  <div className="text-slate-400">
                    <span className="font-semibold">Tone:</span> {post.tone}
                  </div>
                  <div className="text-slate-400">
                    <span className="font-semibold">Basic Score:</span> {post.basic_score}/100
                  </div>
                  <div className="text-slate-400">
                    <span className="font-semibold">Filters:</span>{' '}
                    {post.passed_basic_filter ? 'Pass' : 'Fail'}
                    {' | '}
                    {post.passed_llm_filter ? 'Pass' : 'Fail'}
                  </div>
                </div>

                {/* Generated Comment */}
                <div className="bg-slate-700 rounded-lg p-4 mb-4">
                  <p className="text-slate-300 text-sm font-semibold mb-2">Generated Comment:</p>
                  <p className="text-white">{post.comment || 'No comment generated yet.'}</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {post.status === 'pending' && (
                    <>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(post.id)}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                        >
                          Approve & Post
                        </button>
                        <button
                          onClick={() => handleReject(post.id)}
                          disabled={loading}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                        >
                          Reject
                        </button>
                      </div>

                      {/* Refinement Section */}
                      {expandedPostId === post.id && (
                        <div className="bg-slate-700 rounded-lg p-4">
                          <p className="text-slate-300 text-sm font-semibold mb-2">
                            Refine Comment
                          </p>
                          <textarea
                            value={refinementText[post.id] || ''}
                            onChange={(e) =>
                              setRefinementText({
                                ...refinementText,
                                [post.id]: e.target.value,
                              })
                            }
                            placeholder="Provide feedback to refine the generated comment..."
                            className="w-full bg-slate-600 text-white rounded-lg p-3 border border-slate-500 focus:outline-none focus:border-cyan-400 mb-2"
                            rows={3}
                          />
                          <button
                            onClick={() => handleRefine(post.id)}
                            disabled={loading}
                            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                          >
                            Apply Refinement
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() =>
                          setExpandedPostId(
                            expandedPostId === post.id ? null : post.id
                          )
                        }
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                      >
                        {expandedPostId === post.id ? 'Hide Refinement' : 'Refine Comment'}
                      </button>
                    </>
                  )}

                  {post.status === 'approved' && (
                    <div className="bg-green-900 border border-green-700 rounded-lg p-4 text-green-200">
                      Comment posted on LinkedIn
                    </div>
                  )}

                  {post.status === 'rejected' && (
                    <div className="bg-red-900 border border-red-700 rounded-lg p-4 text-red-200">
                      Post rejected
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-12 text-center text-slate-400 text-sm">
        <p>
          This automation tool scrapes LinkedIn posts, generates AI comments, and
          posts them back. Always review before approving.
        </p>
      </div>
    </div>
  );
};;

export default LinkedInAutomation;
