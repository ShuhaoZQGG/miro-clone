import { VideoChatManager } from '../video-chat-manager';

describe('VideoChatManager', () => {
  let manager: VideoChatManager;
  let mockStream: MediaStream;
  let mockPeerConnection: RTCPeerConnection;

  beforeEach(() => {
    // Create mock tracks with mutable enabled property
    const videoTrack = { kind: 'video', enabled: true, stop: jest.fn() };
    const audioTrack = { kind: 'audio', enabled: true, stop: jest.fn() };
    
    // Mock MediaStream
    mockStream = {
      id: 'mock-stream-id',
      active: true,
      getTracks: jest.fn(() => [videoTrack, audioTrack])
    } as unknown as MediaStream;

    // Mock RTCPeerConnection
    mockPeerConnection = {
      addTrack: jest.fn(),
      removeTrack: jest.fn(),
      createOffer: jest.fn(() => Promise.resolve({ type: 'offer', sdp: 'mock-sdp' })),
      createAnswer: jest.fn(() => Promise.resolve({ type: 'answer', sdp: 'mock-sdp' })),
      setLocalDescription: jest.fn(),
      setRemoteDescription: jest.fn(),
      close: jest.fn(),
      connectionState: 'new',
      onicecandidate: null,
      ontrack: null
    } as unknown as RTCPeerConnection;

    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn(() => Promise.resolve(mockStream))
      },
      writable: true,
      configurable: true
    });

    // Mock RTCPeerConnection constructor
    global.RTCPeerConnection = jest.fn(() => mockPeerConnection) as any;

    manager = new VideoChatManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Local Media Management', () => {
    it('should initialize local stream', async () => {
      const stream = await manager.initializeLocalStream();
      
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: true,
        audio: true
      });
      expect(stream).toBe(mockStream);
    });

    it('should toggle video track', async () => {
      await manager.initializeLocalStream();
      const videoTrack = mockStream.getTracks().find(t => t.kind === 'video');
      
      manager.toggleVideo();
      expect(videoTrack!.enabled).toBe(false);
      
      manager.toggleVideo();
      expect(videoTrack!.enabled).toBe(true);
    });

    it('should toggle audio track', async () => {
      await manager.initializeLocalStream();
      const audioTrack = mockStream.getTracks().find(t => t.kind === 'audio');
      
      manager.toggleAudio();
      expect(audioTrack!.enabled).toBe(false);
      
      manager.toggleAudio();
      expect(audioTrack!.enabled).toBe(true);
    });

    it('should stop all tracks when stopping stream', async () => {
      await manager.initializeLocalStream();
      const tracks = mockStream.getTracks();
      
      manager.stopLocalStream();
      
      tracks.forEach(track => {
        expect(track.stop).toHaveBeenCalled();
      });
    });
  });

  describe('Peer Connection Management', () => {
    it('should create peer connection', async () => {
      const peerId = 'peer-123';
      const connection = await manager.createPeerConnection(peerId);
      
      expect(global.RTCPeerConnection).toHaveBeenCalledWith({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      expect(connection).toBe(mockPeerConnection);
    });

    it('should add local stream tracks to peer connection', async () => {
      await manager.initializeLocalStream();
      const peerId = 'peer-123';
      await manager.createPeerConnection(peerId);
      
      const tracks = mockStream.getTracks();
      tracks.forEach(track => {
        expect(mockPeerConnection.addTrack).toHaveBeenCalledWith(track, mockStream);
      });
    });

    it('should handle ICE candidates', async () => {
      const peerId = 'peer-123';
      const onIceCandidate = jest.fn();
      manager.on('ice-candidate', onIceCandidate);
      
      await manager.createPeerConnection(peerId);
      
      // Simulate ICE candidate event
      const candidate = { candidate: 'mock-candidate' };
      mockPeerConnection.onicecandidate!({ candidate } as any);
      
      expect(onIceCandidate).toHaveBeenCalledWith({
        peerId,
        candidate
      });
    });

    it('should handle remote tracks', async () => {
      const peerId = 'peer-123';
      const onRemoteStream = jest.fn();
      manager.on('remote-stream', onRemoteStream);
      
      await manager.createPeerConnection(peerId);
      
      // Simulate remote track event
      const remoteStream = { id: 'remote-stream' } as MediaStream;
      mockPeerConnection.ontrack!({ streams: [remoteStream] } as any);
      
      expect(onRemoteStream).toHaveBeenCalledWith({
        peerId,
        stream: remoteStream
      });
    });

    it('should close peer connection', async () => {
      const peerId = 'peer-123';
      await manager.createPeerConnection(peerId);
      
      manager.closePeerConnection(peerId);
      
      expect(mockPeerConnection.close).toHaveBeenCalled();
    });
  });

  describe('Signaling', () => {
    beforeEach(async () => {
      await manager.initializeLocalStream();
    });

    it('should create and send offer', async () => {
      const peerId = 'peer-123';
      const onSignal = jest.fn();
      manager.on('signal', onSignal);
      
      const offer = await manager.createOffer(peerId);
      
      expect(mockPeerConnection.createOffer).toHaveBeenCalled();
      expect(mockPeerConnection.setLocalDescription).toHaveBeenCalledWith(offer);
      expect(onSignal).toHaveBeenCalledWith({
        type: 'offer',
        peerId,
        data: offer
      });
    });

    it('should handle received offer and create answer', async () => {
      const peerId = 'peer-123';
      const offer = { type: 'offer', sdp: 'remote-offer-sdp' } as RTCSessionDescriptionInit;
      const onSignal = jest.fn();
      manager.on('signal', onSignal);
      
      const answer = await manager.handleOffer(peerId, offer);
      
      expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalledWith(offer);
      expect(mockPeerConnection.createAnswer).toHaveBeenCalled();
      expect(mockPeerConnection.setLocalDescription).toHaveBeenCalledWith(answer);
      expect(onSignal).toHaveBeenCalledWith({
        type: 'answer',
        peerId,
        data: answer
      });
    });

    it('should handle received answer', async () => {
      const peerId = 'peer-123';
      await manager.createPeerConnection(peerId);
      
      const answer = { type: 'answer', sdp: 'remote-answer-sdp' } as RTCSessionDescriptionInit;
      await manager.handleAnswer(peerId, answer);
      
      expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalledWith(answer);
    });

    it('should handle ICE candidate from remote peer', async () => {
      const peerId = 'peer-123';
      await manager.createPeerConnection(peerId);
      
      const candidate = { candidate: 'remote-candidate' } as RTCIceCandidateInit;
      mockPeerConnection.addIceCandidate = jest.fn();
      
      await manager.handleIceCandidate(peerId, candidate);
      
      expect(mockPeerConnection.addIceCandidate).toHaveBeenCalledWith(candidate);
    });
  });

  describe('Room Management', () => {
    it('should join room and notify peers', async () => {
      const roomId = 'room-123';
      const userId = 'user-456';
      const onRoomJoined = jest.fn();
      manager.on('room-joined', onRoomJoined);
      
      await manager.joinRoom(roomId, userId);
      
      expect(onRoomJoined).toHaveBeenCalledWith({
        roomId,
        userId
      });
    });

    it('should leave room and close all connections', async () => {
      const roomId = 'room-123';
      const userId = 'user-456';
      const peerId1 = 'peer-1';
      const peerId2 = 'peer-2';
      
      await manager.joinRoom(roomId, userId);
      await manager.createPeerConnection(peerId1);
      await manager.createPeerConnection(peerId2);
      
      const onRoomLeft = jest.fn();
      manager.on('room-left', onRoomLeft);
      
      manager.leaveRoom();
      
      expect(mockPeerConnection.close).toHaveBeenCalledTimes(2);
      expect(onRoomLeft).toHaveBeenCalledWith({ roomId });
    });

    it('should handle peer joining room', async () => {
      const peerId = 'peer-789';
      const onPeerJoined = jest.fn();
      manager.on('peer-joined', onPeerJoined);
      
      await manager.handlePeerJoined(peerId);
      
      expect(onPeerJoined).toHaveBeenCalledWith({ peerId });
    });

    it('should handle peer leaving room', () => {
      const peerId = 'peer-789';
      const onPeerLeft = jest.fn();
      manager.on('peer-left', onPeerLeft);
      
      manager.handlePeerLeft(peerId);
      
      expect(onPeerLeft).toHaveBeenCalledWith({ peerId });
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should get connection statistics', async () => {
      const peerId = 'peer-123';
      await manager.createPeerConnection(peerId);
      
      const mockStats = {
        forEach: jest.fn((callback) => {
          callback({
            type: 'inbound-rtp',
            bytesReceived: 1000,
            packetsLost: 5
          });
        })
      };
      
      mockPeerConnection.getStats = jest.fn(() => Promise.resolve(mockStats)) as any;
      
      const stats = await manager.getConnectionStats(peerId);
      
      expect(stats).toEqual({
        bytesReceived: 1000,
        packetsLost: 5
      });
    });

    it('should monitor connection state changes', async () => {
      const peerId = 'peer-123';
      const onConnectionStateChange = jest.fn();
      manager.on('connection-state-change', onConnectionStateChange);
      
      await manager.createPeerConnection(peerId);
      
      // Simulate connection state change
      mockPeerConnection.onconnectionstatechange = jest.fn();
      Object.defineProperty(mockPeerConnection, 'connectionState', {
        value: 'connected',
        writable: true
      });
      
      mockPeerConnection.onconnectionstatechange!({} as Event);
      
      expect(onConnectionStateChange).toHaveBeenCalledWith({
        peerId,
        state: 'connected'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle getUserMedia errors', async () => {
      const error = new Error('Permission denied');
      navigator.mediaDevices.getUserMedia = jest.fn(() => Promise.reject(error));
      
      await expect(manager.initializeLocalStream()).rejects.toThrow('Permission denied');
    });

    it('should handle peer connection creation errors', async () => {
      global.RTCPeerConnection = jest.fn(() => {
        throw new Error('Failed to create connection');
      }) as any;
      
      const peerId = 'peer-123';
      await expect(manager.createPeerConnection(peerId)).rejects.toThrow('Failed to create connection');
    });

    it('should emit error events', async () => {
      const onError = jest.fn();
      manager.on('error', onError);
      
      const error = new Error('Test error');
      manager.emitError(error);
      
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('Configuration', () => {
    it('should use custom STUN/TURN servers', async () => {
      const customConfig = {
        iceServers: [
          { urls: 'stun:custom.stun.server:3478' },
          { 
            urls: 'turn:custom.turn.server:3478',
            username: 'user',
            credential: 'pass'
          }
        ]
      };
      
      manager = new VideoChatManager(customConfig);
      await manager.createPeerConnection('peer-123');
      
      expect(global.RTCPeerConnection).toHaveBeenCalledWith(customConfig);
    });

    it('should configure media constraints', async () => {
      const constraints = {
        video: {
          width: { min: 1280 },
          height: { min: 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      };
      
      manager = new VideoChatManager(undefined, constraints);
      await manager.initializeLocalStream();
      
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(constraints);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all resources on destroy', async () => {
      const peerId1 = 'peer-1';
      const peerId2 = 'peer-2';
      
      await manager.initializeLocalStream();
      await manager.createPeerConnection(peerId1);
      await manager.createPeerConnection(peerId2);
      
      manager.destroy();
      
      // Check all tracks stopped
      const tracks = mockStream.getTracks();
      tracks.forEach(track => {
        expect(track.stop).toHaveBeenCalled();
      });
      
      // Check all connections closed
      expect(mockPeerConnection.close).toHaveBeenCalledTimes(2);
    });
  });
});