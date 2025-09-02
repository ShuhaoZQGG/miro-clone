import { EventEmitter } from 'events';

export interface VideoChatConfig {
  iceServers?: RTCIceServer[];
}

export interface MediaConstraints {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}

export interface ConnectionStats {
  bytesReceived?: number;
  bytesSent?: number;
  packetsLost?: number;
  packetsReceived?: number;
  roundTripTime?: number;
  jitter?: number;
}

export class VideoChatManager extends EventEmitter {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private config: RTCConfiguration;
  private mediaConstraints: MediaConstraints;
  private currentRoom: string | null = null;
  private currentUserId: string | null = null;
  private isVideoEnabled: boolean = true;
  private isAudioEnabled: boolean = true;

  constructor(
    config?: VideoChatConfig,
    mediaConstraints?: MediaConstraints
  ) {
    super();
    
    this.config = {
      iceServers: config?.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };
    
    this.mediaConstraints = mediaConstraints || {
      video: true,
      audio: true
    };
  }

  async initializeLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
      
      // Set initial track states
      this.localStream.getTracks().forEach(track => {
        if (track.kind === 'video') {
          track.enabled = this.isVideoEnabled;
        } else if (track.kind === 'audio') {
          track.enabled = this.isAudioEnabled;
        }
      });
      
      return this.localStream;
    } catch (error) {
      this.emitError(error as Error);
      throw error;
    }
  }

  toggleVideo(): void {
    if (!this.localStream) return;
    
    const videoTrack = this.localStream.getTracks().find(t => t.kind === 'video');
    if (videoTrack) {
      this.isVideoEnabled = !videoTrack.enabled;
      videoTrack.enabled = this.isVideoEnabled;
    }
    
    this.emit('video-toggled', this.isVideoEnabled);
  }

  toggleAudio(): void {
    if (!this.localStream) return;
    
    const audioTrack = this.localStream.getTracks().find(t => t.kind === 'audio');
    if (audioTrack) {
      this.isAudioEnabled = !audioTrack.enabled;
      audioTrack.enabled = this.isAudioEnabled;
    }
    
    this.emit('audio-toggled', this.isAudioEnabled);
  }

  stopLocalStream(): void {
    if (!this.localStream) return;
    
    this.localStream.getTracks().forEach(track => {
      track.stop();
    });
    
    this.localStream = null;
  }

  async createPeerConnection(peerId: string): Promise<RTCPeerConnection> {
    try {
      const connection = new RTCPeerConnection(this.config);
      
      // Add local stream tracks if available
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          connection.addTrack(track, this.localStream!);
        });
      }
      
      // Handle ICE candidates
      connection.onicecandidate = (event) => {
        if (event.candidate) {
          this.emit('ice-candidate', {
            peerId,
            candidate: event.candidate
          });
        }
      };
      
      // Handle remote tracks
      connection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.remoteStreams.set(peerId, event.streams[0]);
          this.emit('remote-stream', {
            peerId,
            stream: event.streams[0]
          });
        }
      };
      
      // Handle connection state changes
      connection.onconnectionstatechange = () => {
        this.emit('connection-state-change', {
          peerId,
          state: connection.connectionState
        });
        
        if (connection.connectionState === 'failed') {
          this.handleConnectionFailure(peerId);
        }
      };
      
      this.peerConnections.set(peerId, connection);
      return connection;
    } catch (error) {
      this.emitError(error as Error);
      throw error;
    }
  }

  closePeerConnection(peerId: string): void {
    const connection = this.peerConnections.get(peerId);
    if (connection) {
      connection.close();
      this.peerConnections.delete(peerId);
      this.remoteStreams.delete(peerId);
    }
  }

  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    let connection = this.peerConnections.get(peerId);
    if (!connection) {
      connection = await this.createPeerConnection(peerId);
    }
    
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    
    this.emit('signal', {
      type: 'offer',
      peerId,
      data: offer
    });
    
    return offer;
  }

  async handleOffer(
    peerId: string, 
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    let connection = this.peerConnections.get(peerId);
    if (!connection) {
      connection = await this.createPeerConnection(peerId);
    }
    
    await connection.setRemoteDescription(offer);
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);
    
    this.emit('signal', {
      type: 'answer',
      peerId,
      data: answer
    });
    
    return answer;
  }

  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const connection = this.peerConnections.get(peerId);
    if (!connection) {
      throw new Error(`No connection found for peer ${peerId}`);
    }
    
    await connection.setRemoteDescription(answer);
  }

  async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const connection = this.peerConnections.get(peerId);
    if (!connection) {
      throw new Error(`No connection found for peer ${peerId}`);
    }
    
    await connection.addIceCandidate(candidate);
  }

  async joinRoom(roomId: string, userId: string): Promise<void> {
    this.currentRoom = roomId;
    this.currentUserId = userId;
    
    // Initialize local stream if not already done
    if (!this.localStream) {
      await this.initializeLocalStream();
    }
    
    this.emit('room-joined', {
      roomId,
      userId
    });
  }

  leaveRoom(): void {
    if (!this.currentRoom) return;
    
    // Close all peer connections
    this.peerConnections.forEach((connection, peerId) => {
      this.closePeerConnection(peerId);
    });
    
    const roomId = this.currentRoom;
    this.currentRoom = null;
    this.currentUserId = null;
    
    this.emit('room-left', { roomId });
  }

  async handlePeerJoined(peerId: string): Promise<void> {
    // Create connection and send offer to new peer
    await this.createPeerConnection(peerId);
    this.emit('peer-joined', { peerId });
  }

  handlePeerLeft(peerId: string): void {
    this.closePeerConnection(peerId);
    this.emit('peer-left', { peerId });
  }

  async getConnectionStats(peerId: string): Promise<ConnectionStats> {
    const connection = this.peerConnections.get(peerId);
    if (!connection) {
      throw new Error(`No connection found for peer ${peerId}`);
    }
    
    const stats = await connection.getStats();
    const result: ConnectionStats = {};
    
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp') {
        result.bytesReceived = report.bytesReceived;
        result.packetsReceived = report.packetsReceived;
        result.packetsLost = report.packetsLost;
        result.jitter = report.jitter;
      } else if (report.type === 'outbound-rtp') {
        result.bytesSent = report.bytesSent;
      } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        result.roundTripTime = report.currentRoundTripTime;
      }
    });
    
    return result;
  }

  private handleConnectionFailure(peerId: string): void {
    this.emit('connection-failed', { peerId });
    this.closePeerConnection(peerId);
  }

  emitError(error: Error): void {
    this.emit('error', error);
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(peerId: string): MediaStream | null {
    return this.remoteStreams.get(peerId) || null;
  }

  getPeerIds(): string[] {
    return Array.from(this.peerConnections.keys());
  }

  isInRoom(): boolean {
    return this.currentRoom !== null;
  }

  getCurrentRoom(): string | null {
    return this.currentRoom;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  destroy(): void {
    // Stop local stream
    this.stopLocalStream();
    
    // Close all peer connections
    this.peerConnections.forEach((connection, peerId) => {
      this.closePeerConnection(peerId);
    });
    
    // Clear all data
    this.peerConnections.clear();
    this.remoteStreams.clear();
    this.currentRoom = null;
    this.currentUserId = null;
    
    // Remove all event listeners
    this.removeAllListeners();
  }
}