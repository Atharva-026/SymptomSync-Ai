class DailyService {
  constructor() {
    this.apiKey = process.env.REACT_APP_DAILY_API_KEY;
    this.baseUrl = 'https://api.daily.co/v1';
  }

  // Generate unique room name
  generateRoomName(appointmentId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `apt-${appointmentId}-${timestamp}-${random}`;
  }

  async createRoom(appointmentId = null) {
    try {
      if (!this.apiKey) {
        console.warn('⚠️ Daily.co API key not configured');
        return {
          url: `https://symptomsync.daily.co/demo-${Date.now()}`,
          name: `demo-room-${Date.now()}`,
        };
      }

      // Generate unique room name
      const roomName = this.generateRoomName(appointmentId || Date.now());

      const response = await fetch(`${this.baseUrl}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          name: roomName,
          privacy: 'private',
          properties: {
            enable_screenshare: true,
            enable_chat: true,
            enable_knocking: false,
            max_participants: 10,
            exp: Math.floor(Date.now() / 1000) + 7200, // 2 hours
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // If room exists, try to get existing room
        if (error.error === 'invalid-request-error' && error.info?.includes('already exists')) {
          console.log('Room exists, trying to fetch existing room...');
          // Generate new unique name and try again
          return this.createRoom(appointmentId);
        }
        
        throw new Error(error.info || 'Failed to create room');
      }

      const room = await response.json();
      // Ensure room has a full URL to join. API may return a name only.
      room.url = room.url || `https://${room.name}.daily.co`;
      console.log('✅ Room created successfully:', room.name);
      return room;
    } catch (error) {
      console.error('Error creating Daily.co room:', error);
      throw error;
    }
  }

  async getOrCreateRoom(appointmentId) {
    try {
      // Try to create a new room
      return await this.createRoom(appointmentId);
    } catch (error) {
      console.error('Failed to get or create room:', error);
      throw error;
    }
  }

  async deleteRoom(roomName) {
    try {
      if (!this.apiKey) {
        return true;
      }

      const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting room:', error);
      return false;
    }
  }
}

const dailyService = new DailyService();
export default dailyService;