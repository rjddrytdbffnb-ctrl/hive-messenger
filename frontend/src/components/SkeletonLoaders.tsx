// src/components/SkeletonLoaders.tsx
import React from 'react';

export const MessageSkeleton: React.FC = () => (
  <div className="fade-in" style={{ padding: '16px', marginBottom: '8px' }}>
    <div style={{ display: 'flex', gap: '12px' }}>
      <div className="skeleton skeleton-avatar"></div>
      <div style={{ flex: 1 }}>
        <div className="skeleton skeleton-text" style={{ width: '30%' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
      </div>
    </div>
  </div>
);

export const ChatListSkeleton: React.FC = () => (
  <div className="fade-in">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} style={{ padding: '12px', marginBottom: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div className="skeleton skeleton-avatar"></div>
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: '8px' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '70%' }}></div>
        </div>
      </div>
    ))}
  </div>
);

export const TaskSkeleton: React.FC = () => (
  <div className="fade-in" style={{ padding: '16px', marginBottom: '12px', background: 'var(--bg-primary)', borderRadius: '12px' }}>
    <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: '12px', height: '20px' }}></div>
    <div className="skeleton skeleton-text" style={{ width: '100%' }}></div>
    <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
      <div className="skeleton skeleton-button" style={{ width: '100px' }}></div>
      <div className="skeleton skeleton-button" style={{ width: '100px' }}></div>
    </div>
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="fade-in" style={{ padding: '24px', textAlign: 'center' }}>
    <div className="skeleton" style={{ width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 16px' }}></div>
    <div className="skeleton skeleton-text" style={{ width: '200px', height: '24px', margin: '0 auto 8px' }}></div>
    <div className="skeleton skeleton-text" style={{ width: '150px', margin: '0 auto' }}></div>
  </div>
);

interface SkeletonProps {
  count?: number;
  type?: 'message' | 'chat' | 'task' | 'profile';
}

export const Skeleton: React.FC<SkeletonProps> = ({ count = 1, type = 'message' }) => {
  const components = {
    message: MessageSkeleton,
    chat: ChatListSkeleton,
    task: TaskSkeleton,
    profile: ProfileSkeleton,
  };

  const Component = components[type];

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </>
  );
};

export default Skeleton;
