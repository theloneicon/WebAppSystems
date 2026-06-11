// src/utils/api.js
const API_BASE = 'https://script.google.com/macros/s/AKfycbxAqsJtI4NzTgCdDpneqYZLgh0xAhVM-zMTyNkqLVGOUy7g5NgdT9qYUAySXTrrg56gEA/exec';

export const api = {
  login: async (employeeID, password) => {
    const response = await fetch(
      `${API_BASE}?endpoint=login&employeeID=${encodeURIComponent(employeeID)}&password=${encodeURIComponent(password)}`,
      {
        method: 'GET',
        mode: 'cors',         // Explicitly state we are using Cross-Origin Resource Sharing
        redirect: 'follow'    // CRITICAL: Tells the browser to transparently follow Google's 302 redirect
      }
    );
    return response.json();
  },

  // Get available approvers for dropdown
  getApprovers: async (aprvLevel, deptID, aprvRegAprv) => {
    const url = `${API_BASE}?endpoint=getApprovers&aprvLevel=${encodeURIComponent(aprvLevel)}&deptID=${encodeURIComponent(deptID)}&aprvRegAprv=${encodeURIComponent(aprvRegAprv)}`;
    console.log('Fetching approvers:', url);  // Debug
    const response = await fetch(url);
    const data = await response.json();
    console.log('Approvers response:', data);  // Debug
    return data;
  },
  
  getMyRequests: async (employeeID) => {
    const response = await fetch(
      `${API_BASE}?endpoint=getMyRequests&employeeID=${encodeURIComponent(employeeID)}`,
      { method: 'GET', 
        mode: 'cors', 
        redirect: 'follow' }
    );
    return response.json();
  },
  
  createRequest: async (employeeID, approverID, startDate, endDate, totalDays, reason , leaveType) => {
    const response = await fetch(
      `${API_BASE}?endpoint=createRequest&employeeID=${encodeURIComponent(employeeID)}&approverID=${encodeURIComponent(approverID)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&totalDays=${encodeURIComponent(totalDays)}&reason=${encodeURIComponent(reason)}&leaveType=${encodeURIComponent(leaveType)}`,
      { 
        method: 'GET', 
        mode: 'cors', 
        redirect: 'follow' 
      }
    );
    return response.json();
  },
  
  cancelRequest: async (requestID, employeeID) => {
    const response = await fetch(
      `${API_BASE}?endpoint=cancelRequest&requestID=${encodeURIComponent(requestID)}&employeeID=${encodeURIComponent(employeeID)}`,
      { method: 'GET', 
        mode: 'cors', 
        redirect: 'follow' }
    );
    return response.json();
  },

  getPendingApprovals: async (approverID, accessLevel) => {
  const response = await fetch(
    `${API_BASE}?endpoint=getPendingApprovals&approverID=${encodeURIComponent(approverID)}&accessLevel=${encodeURIComponent(accessLevel)}`
  );
  return response.json();
  },

  approveRequest: async (requestID, approverID, comments) => {
  const response = await fetch(
    `${API_BASE}?endpoint=approveRequest&requestID=${encodeURIComponent(requestID)}&approverID=${encodeURIComponent(approverID)}&comments=${encodeURIComponent(comments)}`
  );
  return response.json();
  },

  rejectRequest: async (requestID, approverID, comments) => {
  const response = await fetch(
    `${API_BASE}?endpoint=rejectRequest&requestID=${encodeURIComponent(requestID)}&approverID=${encodeURIComponent(approverID)}&comments=${encodeURIComponent(comments)}`
  );
  return response.json();
  }  
};

