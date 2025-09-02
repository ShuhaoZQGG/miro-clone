'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VideoChatManager } from '@/lib/canvas-features/video-chat-manager';
import { Button } from '@/components/ui/Button';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Users,
  Maximize2,
  Minimize2,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

interface VideoChatProps {
  roomId: string;
  userId: string;
  className?: string;
  onClose?: () => void;
}

interface Participant {
  id: string;
  stream: MediaStream;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

export const VideoChat: React.FC<VideoChatProps> = ({
  roomId,
  userId,
  className,
  onClose
}) => {
  const { showToast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'medium' | 'poor'>('good');
  
  const videoChatManagerRef = useRef<VideoChatManager | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initializeVideoChat = async () => {
      try {
        const manager = new VideoChatManager();
        videoChatManagerRef.current = manager;

        // Set up event listeners
        manager.on('remote-stream', handleRemoteStream);
        manager.on('peer-joined', handlePeerJoined);
        manager.on('peer-left', handlePeerLeft);
        manager.on('connection-state-change', handleConnectionStateChange);
        manager.on('error', handleError);
        manager.on('video-toggled', (enabled: boolean) => setIsVideoEnabled(enabled));
        manager.on('audio-toggled', (enabled: boolean) => setIsAudioEnabled(enabled));

        // Initialize and join room
        const localStream = await manager.initializeLocalStream();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        await manager.joinRoom(roomId, userId);
        setIsConnected(true);

        // Start monitoring connection quality
        startQualityMonitoring();

        showToast({
          type: 'success',
          title: 'Connected',
          message: 'You have joined the video chat',
        });
      } catch (error) {
        console.error('Failed to initialize video chat:', error);
        showToast({
          type: 'error',
          title: 'Connection Failed',
          message: 'Failed to start video chat. Please check your camera and microphone permissions.',
        });
      }
    };

    initializeVideoChat();

    return () => {
      cleanup();
    };
  }, [roomId, userId]);

  const cleanup = useCallback(() => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
    }
    
    if (videoChatManagerRef.current) {
      videoChatManagerRef.current.destroy();
      videoChatManagerRef.current = null;
    }
    
    setParticipants(new Map());
    setIsConnected(false);
  }, []);

  const handleRemoteStream = useCallback(({ peerId, stream }: { peerId: string; stream: MediaStream }) => {
    setParticipants(prev => {
      const updated = new Map(prev);
      updated.set(peerId, {
        id: peerId,
        stream,
        isAudioEnabled: true,
        isVideoEnabled: true
      });
      return updated;
    });
  }, []);

  const handlePeerJoined = useCallback(({ peerId }: { peerId: string }) => {
    showToast({
      type: 'info',
      title: 'User Joined',
      message: `User ${peerId.slice(0, 8)} joined the call`,
    });
  }, [showToast]);

  const handlePeerLeft = useCallback(({ peerId }: { peerId: string }) => {
    setParticipants(prev => {
      const updated = new Map(prev);
      updated.delete(peerId);
      return updated;
    });
    
    showToast({
      type: 'info',
      title: 'User Left',
      message: `User ${peerId.slice(0, 8)} left the call`,
    });
  }, [showToast]);

  const handleConnectionStateChange = useCallback(({ peerId, state }: { peerId: string; state: string }) => {
    if (state === 'failed') {
      showToast({
        type: 'error',
        title: 'Connection Lost',
        message: `Lost connection to user ${peerId.slice(0, 8)}`,
      });
    }
  }, [showToast]);

  const handleError = useCallback((error: Error) => {
    console.error('Video chat error:', error);
    showToast({
      type: 'error',
      title: 'Error',
      message: error.message,
    });
  }, [showToast]);

  const startQualityMonitoring = useCallback(() => {
    if (!videoChatManagerRef.current) return;

    statsIntervalRef.current = setInterval(async () => {
      const manager = videoChatManagerRef.current;
      if (!manager) return;

      const peerIds = manager.getPeerIds();
      if (peerIds.length === 0) return;

      try {
        // Get stats from first peer as sample
        const stats = await manager.getConnectionStats(peerIds[0]);
        
        // Determine quality based on packet loss
        if (stats.packetsLost && stats.packetsReceived) {
          const lossRate = stats.packetsLost / (stats.packetsLost + stats.packetsReceived);
          if (lossRate < 0.01) {
            setConnectionQuality('good');
          } else if (lossRate < 0.05) {
            setConnectionQuality('medium');
          } else {
            setConnectionQuality('poor');
          }
        }
      } catch (error) {
        console.error('Failed to get connection stats:', error);
      }
    }, 5000);
  }, []);

  const toggleVideo = useCallback(() => {
    if (videoChatManagerRef.current) {
      videoChatManagerRef.current.toggleVideo();
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (videoChatManagerRef.current) {
      videoChatManagerRef.current.toggleAudio();
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const endCall = useCallback(() => {
    cleanup();
    onClose?.();
    
    showToast({
      type: 'info',
      title: 'Call Ended',
      message: 'You have left the video chat',
    });
  }, [cleanup, onClose, showToast]);

  const getQualityIndicator = () => {
    switch (connectionQuality) {
      case 'good':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'medium':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'poor':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative bg-gray-900 rounded-lg overflow-hidden',
        isFullscreen ? 'fixed inset-0 z-50' : 'w-full h-full',
        className
      )}
    >
      {/* Main video area */}
      <div className="relative w-full h-full">
        {/* Remote participants */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4 h-full">
          {Array.from(participants.values()).map((participant) => (
            <VideoParticipant
              key={participant.id}
              participant={participant}
              isSelected={selectedParticipant === participant.id}
              onClick={() => setSelectedParticipant(participant.id)}
            />
          ))}
          
          {/* Empty state */}
          {participants.size === 0 && (
            <div className="col-span-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Waiting for others to join...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-20 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="absolute top-2 left-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
            You
          </div>
        </div>

        {/* Connection quality indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black bg-opacity-50 px-3 py-2 rounded-lg">
          {getQualityIndicator()}
          <span className="text-xs text-white">
            {participants.size} participant{participants.size !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isAudioEnabled ? 'secondary' : 'destructive'}
            size="sm"
            onClick={toggleAudio}
            className="rounded-full w-12 h-12"
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>

          <Button
            variant={isVideoEnabled ? 'secondary' : 'destructive'}
            size="sm"
            onClick={toggleVideo}
            className="rounded-full w-12 h-12"
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={endCall}
            className="rounded-full w-14 h-14"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFullscreen}
            className="rounded-full w-12 h-12"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="rounded-full w-12 h-12"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

interface VideoParticipantProps {
  participant: Participant;
  isSelected: boolean;
  onClick: () => void;
}

const VideoParticipant: React.FC<VideoParticipantProps> = ({
  participant,
  isSelected,
  onClick
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  return (
    <div
      className={cn(
        'relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all',
        isSelected && 'ring-2 ring-blue-500'
      )}
      onClick={onClick}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      
      {!participant.isVideoEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <VideoOff className="w-12 h-12 text-gray-400" />
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 flex items-center gap-2">
        <div className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
          User {participant.id.slice(0, 8)}
        </div>
        {!participant.isAudioEnabled && (
          <div className="bg-red-500 bg-opacity-75 p-1 rounded">
            <MicOff className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};