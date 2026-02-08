class VideoService {
  generateRoomName(appointmentId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `symptomsync-${appointmentId}-${timestamp}-${random}`;
  }

  async createRoom(appointmentId = null) {
    try {
      const roomName = this.generateRoomName(appointmentId || Date.now());
      
      // Jitsi doesn't require API calls - just use the URL
      const roomUrl = `https://meet.jit.si/${roomName}`;
      
      console.log('✅ Jitsi room created');
      console.log('   Room name:', roomName);
      console.log('   Room URL:', roomUrl);
      
      return {
        name: roomName,
        url: roomUrl
      };
      
    } catch (error) {
      console.error('❌ Error creating room:', error);
      throw error;
    }
  }

  async getOrCreateRoom(appointmentId) {
    return await this.createRoom(appointmentId);
  }

  async deleteRoom(roomName) {
    // Jitsi rooms auto-delete when empty
    console.log('✅ Jitsi room will auto-delete when empty');
    return true;
  }
}

const videoService = new VideoService();
export default videoService;