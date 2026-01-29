class DailyService {
  constructor() {
    this.apiKey = process.env.REACT_APP_DAILY_API_KEY;
    this.baseUrl = 'https://api.daily.co/v1';
  }

  // Create a new video room
  async createRoom(roomName = null) {
    try {
      const response = await fetch(`${this.baseUrl}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          name: roomName || `room-${Date.now()}`,
          privacy: 'private',
          properties: {
            enable_screenshare: true,
            enable_chat: true,
            enable_knocking: true,
            max_participants: 2, // Patient + Doctor only
            exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const room = await response.json();
      return room;
    } catch (error) {
      console.error('Error creating Daily.co room:', error);
      throw error;
    }
  }

  // Get room details
  async getRoom(roomName) {
    try {
      const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Room not found');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching room:', error);
      throw error;
    }
  }

  // Delete a room
  async deleteRoom(roomName) {
    try {
      const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }

  // Create meeting token (for secure access)
  async createMeetingToken(roomName, userName, isOwner = false) {
    try {
      const response = await fetch(`${this.baseUrl}/meeting-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            user_name: userName,
            is_owner: isOwner,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create meeting token');
      }

      const { token } = await response.json();
      return token;
    } catch (error) {
      console.error('Error creating meeting token:', error);
      throw error;
    }
  }
}

export default new DailyService();