// src/utils/api.js
const API_BASE = 'https://script.google.com/macros/s/AKfycbzNXWwFpsPUWVgNbTYVzTzqqGFoLd2vGfIydlxDuxGZxk2URFRcuRfCyr44SCTTntaELg/exec';

// Helper function to format date as YYYY-MM-DD
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get device info
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  if (/mobile/i.test(userAgent)) return 'Mobile';
  if (/tablet/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
};

// Helper to get IP (using external service or leave empty)
const getIPAddress = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return '';
  }
};

export const api = {
  // ==================== AUTHENTICATION ====================
  login: async (employeeID, password) => {
    try {
      console.log('Attempting login for:', employeeID);
      console.log('API_BASE:', API_BASE);
      
      const url = `${API_BASE}?endpoint=login&employeeID=${encodeURIComponent(employeeID)}&password=${encodeURIComponent(password)}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow'
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      return data;
      
    } catch (error) {
      console.error('Login error details:', error);
      return { 
        success: false, 
        error: `Network error: ${error.message}. Please check if the API is accessible.` 
      };
    }
  },

  // ==================== LEAVE REQUESTS ====================
  getApprovers: async (aprvLevel, deptID, aprvRegAprv) => {
    const url = `${API_BASE}?endpoint=getApprovers&aprvLevel=${encodeURIComponent(aprvLevel)}&deptID=${encodeURIComponent(deptID)}&aprvRegAprv=${encodeURIComponent(aprvRegAprv)}`;
    const response = await fetch(url);
    return response.json();
  },

  getMyRequests: async (employeeID) => {
    const response = await fetch(
      `${API_BASE}?endpoint=getMyRequests&employeeID=${encodeURIComponent(employeeID)}`,
      { method: 'GET', mode: 'cors', redirect: 'follow' }
    );
    return response.json();
  },

  createRequest: async (employeeID, fromDate, toDate, totalDays, leaveType, reason) => {
    const formattedFromDate = formatDate(fromDate);
    const formattedToDate = formatDate(toDate);
    
    const response = await fetch(
      `${API_BASE}?endpoint=createRequest&employeeID=${encodeURIComponent(employeeID)}&fromDate=${encodeURIComponent(formattedFromDate)}&toDate=${encodeURIComponent(formattedToDate)}&totalDays=${encodeURIComponent(totalDays)}&leaveType=${encodeURIComponent(leaveType)}&reason=${encodeURIComponent(reason)}`,
      { method: 'GET', mode: 'cors', redirect: 'follow' }
    );
    return response.json();
  },

  cancelRequest: async (requestID, employeeID) => {
    const response = await fetch(
      `${API_BASE}?endpoint=cancelRequest&requestID=${encodeURIComponent(requestID)}&employeeID=${encodeURIComponent(employeeID)}`,
      { method: 'GET', mode: 'cors', redirect: 'follow' }
    );
    return response.json();
  },

  // ==================== REGULAR APPROVER FUNCTIONS ====================
  getPendingRegularApprovals: async (approverID) => {
    const response = await fetch(
      `${API_BASE}?endpoint=getPendingRegularApprovals&approverID=${encodeURIComponent(approverID)}`
    );
    return response.json();
  },

  notedRequest: async (requestID, approverID, comments) => {
    const response = await fetch(
      `${API_BASE}?endpoint=notedRequest&requestID=${encodeURIComponent(requestID)}&approverID=${encodeURIComponent(approverID)}&comments=${encodeURIComponent(comments)}`
    );
    return response.json();
  },

  rejectRegularRequest: async (requestID, approverID, comments) => {
    const response = await fetch(
      `${API_BASE}?endpoint=rejectRegularRequest&requestID=${encodeURIComponent(requestID)}&approverID=${encodeURIComponent(approverID)}&comments=${encodeURIComponent(comments)}`
    );
    return response.json();
  },

  // ==================== FINAL APPROVER FUNCTIONS ====================
  getPendingFinalApprovals: async (approverID) => {
    const response = await fetch(
      `${API_BASE}?endpoint=getPendingFinalApprovals&approverID=${encodeURIComponent(approverID)}`
    );
    return response.json();
  },

  approveFinalRequest: async (requestID, approverID, comments) => {
    const response = await fetch(
      `${API_BASE}?endpoint=approveFinalRequest&requestID=${encodeURIComponent(requestID)}&approverID=${encodeURIComponent(approverID)}&comments=${encodeURIComponent(comments)}`
    );
    return response.json();
  },

  rejectFinalRequest: async (requestID, approverID, comments) => {
    const response = await fetch(
      `${API_BASE}?endpoint=rejectFinalRequest&requestID=${encodeURIComponent(requestID)}&approverID=${encodeURIComponent(approverID)}&comments=${encodeURIComponent(comments)}`
    );
    return response.json();
  },

  // ==================== GET USER REQUESTS (for dashboard) ====================
  getMyRegularApprovals: async (approverID) => {
    const response = await fetch(
      `${API_BASE}?endpoint=getMyRegularApprovals&approverID=${encodeURIComponent(approverID)}`
    );
    return response.json();
  },

  // ==================== APPROVER FUNCTIONS (Legacy) ====================
  getPendingApprovals: async (approverID, aprvLevel) => {
    const response = await fetch(
      `${API_BASE}?endpoint=getPendingApprovals&approverID=${encodeURIComponent(approverID)}&aprvLevel=${encodeURIComponent(aprvLevel)}`
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
  },

  // ==================== HR / ADMIN FUNCTIONS ====================
  getPendingHRNotifications: async () => {
    const response = await fetch(`${API_BASE}?endpoint=getPendingHRNotifications`);
    return response.json();
  },

  markAsNoted: async (requestID, type, hrID, hrName) => {
    const response = await fetch(
      `${API_BASE}?endpoint=markAsNoted&requestID=${encodeURIComponent(requestID)}&type=${encodeURIComponent(type)}&hrID=${encodeURIComponent(hrID)}&hrName=${encodeURIComponent(hrName)}`
    );
    return response.json();
  },

  getAllRequests: async () => {
    const response = await fetch(`${API_BASE}?endpoint=getAllRequests`);
    return response.json();
  },

  getTodaysStats: async () => {
    const response = await fetch(`${API_BASE}?endpoint=getTodaysStats`);
    return response.json();
  },

  // ==================== ATTENDANCE FUNCTIONS ====================
  getTodayAttendance: async (employeeID) => {
    const response = await fetch(
      `${API_BASE}?endpoint=getTodayAttendance&employeeID=${encodeURIComponent(employeeID)}`
    );
    return response.json();
  },

  clockIn: async (employeeID, employeeName, schedArrangement, locationGPS, scheduleStart) => {
    const now = new Date();
    const logDate = formatDate(now);
    const logTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const device = getDeviceInfo();
    const ipAddress = await getIPAddress();
    
    console.log('Clock In params:', { employeeID, employeeName, schedArrangement, logDate, logTime });
    
    const response = await fetch(
      `${API_BASE}?endpoint=clockIn&employeeID=${encodeURIComponent(employeeID)}&employeeName=${encodeURIComponent(employeeName)}&schedArrangement=${encodeURIComponent(schedArrangement)}&logDate=${encodeURIComponent(logDate)}&logTime=${encodeURIComponent(logTime)}&locationGPS=${encodeURIComponent(locationGPS)}&device=${encodeURIComponent(device)}&ipAddress=${encodeURIComponent(ipAddress)}&scheduleStart=${encodeURIComponent(scheduleStart)}`,
      { method: 'GET', mode: 'cors', redirect: 'follow' }
    );
    return response.json();
  },

  clockOut: async (employeeID, employeeName, schedArrangement, locationGPS, scheduleEnd) => {
    const now = new Date();
    const logDate = formatDate(now);
    const logTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const device = getDeviceInfo();
    const ipAddress = await getIPAddress();
    
    const response = await fetch(
      `${API_BASE}?endpoint=clockOut&employeeID=${encodeURIComponent(employeeID)}&employeeName=${encodeURIComponent(employeeName)}&schedArrangement=${encodeURIComponent(schedArrangement)}&logDate=${encodeURIComponent(logDate)}&logTime=${encodeURIComponent(logTime)}&locationGPS=${encodeURIComponent(locationGPS)}&device=${encodeURIComponent(device)}&ipAddress=${encodeURIComponent(ipAddress)}&scheduleEnd=${encodeURIComponent(scheduleEnd)}`,
      { method: 'GET', mode: 'cors', redirect: 'follow' }
    );
    return response.json();
  },

  recordBreak: async (employeeID, employeeName, schedArrangement, breakType, locationGPS) => {
    const now = new Date();
    const logDate = formatDate(now);
    const logTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const device = getDeviceInfo();
    const ipAddress = await getIPAddress();
    
    const response = await fetch(
      `${API_BASE}?endpoint=recordBreak&employeeID=${encodeURIComponent(employeeID)}&employeeName=${encodeURIComponent(employeeName)}&schedArrangement=${encodeURIComponent(schedArrangement)}&logDate=${encodeURIComponent(logDate)}&logTime=${encodeURIComponent(logTime)}&breakType=${encodeURIComponent(breakType)}&locationGPS=${encodeURIComponent(locationGPS)}&device=${encodeURIComponent(device)}&ipAddress=${encodeURIComponent(ipAddress)}`,
      { method: 'GET', mode: 'cors', redirect: 'follow' }
    );
    return response.json();
  },

  getAttendanceByDate: async (date) => {
    const response = await fetch(
      `${API_BASE}?endpoint=getAttendanceByDate&date=${encodeURIComponent(date)}`
    );
    return response.json();
  },

  excuseViolation: async (recordId, violationType, reference, adminID) => {
    const response = await fetch(
      `${API_BASE}?endpoint=excuseViolation&recordId=${encodeURIComponent(recordId)}&violationType=${encodeURIComponent(violationType)}&reference=${encodeURIComponent(reference)}&adminID=${encodeURIComponent(adminID)}`
    );
    return response.json();
  },

  // ==================== REGULARIZATION FUNCTIONS ====================
  createRegularizationRequest: async (employeeID, employeeName, date, clockIn, clockOut, breakMinutes, totalHours, reason, obReference, approverID) => {
    const formattedDate = formatDate(date);
    const response = await fetch(
      `${API_BASE}?endpoint=createRegularizationRequest&employeeID=${encodeURIComponent(employeeID)}&employeeName=${encodeURIComponent(employeeName)}&date=${encodeURIComponent(formattedDate)}&clockIn=${encodeURIComponent(clockIn)}&clockOut=${encodeURIComponent(clockOut)}&breakMinutes=${encodeURIComponent(breakMinutes)}&totalHours=${encodeURIComponent(totalHours)}&reason=${encodeURIComponent(reason)}&obReference=${encodeURIComponent(obReference)}&approverID=${encodeURIComponent(approverID)}`
    );
    return response.json();
  },

  getMyRegularizations: async (employeeID) => {
    const response = await fetch(
      `${API_BASE}?endpoint=getMyRegularizations&employeeID=${encodeURIComponent(employeeID)}`
    );
    return response.json();
  },

  getPendingRegularizations: async (approverID) => {
    const response = await fetch(
      `${API_BASE}?endpoint=getPendingRegularizations&approverID=${encodeURIComponent(approverID)}`
    );
    return response.json();
  },

  approveRegularization: async (requestID, approverID, comments) => {
    const response = await fetch(
      `${API_BASE}?endpoint=approveRegularization&requestID=${encodeURIComponent(requestID)}&approverID=${encodeURIComponent(approverID)}&comments=${encodeURIComponent(comments)}`
    );
    return response.json();
  },

  rejectRegularization: async (requestID, approverID, comments) => {
    const response = await fetch(
      `${API_BASE}?endpoint=rejectRegularization&requestID=${encodeURIComponent(requestID)}&approverID=${encodeURIComponent(approverID)}&comments=${encodeURIComponent(comments)}`
    );
    return response.json();
  },

  // ==================== ADDITIONAL FUNCTIONS ====================
  getLastClockInTime: async (employeeID) => {
    const response = await fetch(
      `${API_BASE}?endpoint=getLastClockInTime&employeeID=${encodeURIComponent(employeeID)}`
    );
    return response.json();
  },

  getMyAttendance: async (employeeID, month, year) => {
    const response = await fetch(
      `${API_BASE}?endpoint=getMyAttendance&employeeID=${encodeURIComponent(employeeID)}&month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`
    );
    return response.json();
  },

  getEmployeeByRoleId: async (roleId) => {
    const response = await fetch(
      `${API_BASE}?endpoint=getEmployeeByRoleId&roleId=${encodeURIComponent(roleId)}`
    );
    return response.json();
  },

  getDepartmentRequests: async (deptID, approverID) => {
    const response = await fetch(
      `${API_BASE}?endpoint=getDepartmentRequests&deptID=${encodeURIComponent(deptID)}&approverID=${encodeURIComponent(approverID)}`
    );
    return response.json();
  },

  getTeamAttendance: async (deptID, approverID, month, year) => {
    console.log('Calling getTeamAttendance with:', { deptID, approverID, month, year });
    const response = await fetch(
      `${API_BASE}?endpoint=getTeamAttendance&deptID=${encodeURIComponent(deptID)}&approverID=${encodeURIComponent(approverID)}&month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`
    );
    const data = await response.json();
    console.log('getTeamAttendance response:', data);
    return data;
  },
};

export default api;