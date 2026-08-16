import React, { useState } from 'react';
import { Github, Gitlab, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const [githubConnected, setGithubConnected] = useState(false);
  const [gitlabConnected, setGitlabConnected] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [gitlabToken, setGitlabToken] = useState('');
  const [showGhModal, setShowGhModal] = useState(false);
  const [showGlModal, setShowGlModal] = useState(false);

  const handleConnectGithub = () => {
    if (githubToken.trim().length > 0 || !githubConnected) {
      setGithubConnected(true);
      setShowGhModal(false);
    }
  };

  const handleConnectGitlab = () => {
    if (gitlabToken.trim().length > 0 || !gitlabConnected) {
      setGitlabConnected(true);
      setShowGlModal(false);
    }
  };

  const isAtLeastOneConnected = githubConnected || gitlabConnected;

  const handleContinue = () => {
    if (isAtLeastOneConnected) {
      onLoginSuccess({ githubConnected, gitlabConnected, githubToken, gitlabToken });
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#FAFAFA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Centered Login Card */}
      <div style={{
        position: 'absolute',
        top: '28%',
        width: '36%',
        minWidth: '380px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E5E5',
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <ShieldCheck size={24} color="#2563EB" />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A' }}>Remote Authentication</h2>
        </div>
        <p style={{ fontSize: '12px', color: '#666666', marginBottom: '24px', textAlign: 'center' }}>
          Connect <strong>GitHub</strong>, <strong>GitLab</strong>, or both. At least one platform connection is required to proceed.
        </p>

        {/* GitHub connect button */}
        <button
          onClick={() => setShowGhModal(true)}
          style={{
            width: '85%',
            height: '42px',
            backgroundColor: githubConnected ? '#F0FDF4' : '#18181B',
            color: githubConnected ? '#166534' : '#FFFFFF',
            border: githubConnected ? '1px solid #BBF7D0' : '1px solid #18181B',
            borderRadius: '6px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '12px'
          }}
        >
          {githubConnected ? <CheckCircle2 size={18} color="#166534" /> : <Github size={18} />}
          {githubConnected ? 'GitHub Connected ✓' : 'Connect GitHub Account'}
        </button>

        {/* GitLab connect button */}
        <button
          onClick={() => setShowGlModal(true)}
          style={{
            width: '85%',
            height: '42px',
            backgroundColor: gitlabConnected ? '#F0FDF4' : '#FC6D26',
            color: gitlabConnected ? '#166534' : '#FFFFFF',
            border: gitlabConnected ? '1px solid #BBF7D0' : '1px solid #FC6D26',
            borderRadius: '6px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '24px'
          }}
        >
          {gitlabConnected ? <CheckCircle2 size={18} color="#166534" /> : <Gitlab size={18} />}
          {gitlabConnected ? 'GitLab Connected ✓' : 'Connect GitLab Account'}
        </button>

        {/* Continue button: Enabled as soon as AT LEAST ONE is connected */}
        <button
          disabled={!isAtLeastOneConnected}
          onClick={handleContinue}
          style={{
            width: '85%',
            height: '42px',
            backgroundColor: isAtLeastOneConnected ? '#2563EB' : '#E5E5E5',
            color: isAtLeastOneConnected ? '#FFFFFF' : '#888888',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          Continue to Dashboard
          {isAtLeastOneConnected && <ArrowRight size={16} />}
        </button>
      </div>

      {/* GitHub Token Modal */}
      {showGhModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '8px', width: '360px', border: '1px solid #E5E5E5' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 600 }}>Connect GitHub</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>Enter Personal Access Token (PAT):</p>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxx"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #E5E5E5', borderRadius: '4px', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowGhModal(false)} style={{ padding: '6px 12px', background: '#F3F4F6', borderRadius: '4px' }}>Cancel</button>
              <button onClick={handleConnectGithub} style={{ padding: '6px 12px', background: '#2563EB', color: '#FFF', borderRadius: '4px' }}>Save Token</button>
            </div>
          </div>
        </div>
      )}

      {/* GitLab Token Modal */}
      {showGlModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '8px', width: '360px', border: '1px solid #E5E5E5' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 600 }}>Connect GitLab</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>Enter Personal Access Token:</p>
            <input
              type="password"
              placeholder="glpat-xxxxxxxxxxxx"
              value={gitlabToken}
              onChange={(e) => setGitlabToken(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #E5E5E5', borderRadius: '4px', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowGlModal(false)} style={{ padding: '6px 12px', background: '#F3F4F6', borderRadius: '4px' }}>Cancel</button>
              <button onClick={handleConnectGitlab} style={{ padding: '6px 12px', background: '#FC6D26', color: '#FFF', borderRadius: '4px' }}>Save Token</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
