export const getDecodedToken = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    
    const payload = JSON.parse(jsonPayload);
    return payload.sub || payload; 
  } catch (e) {
    return null;
  }
};

export const getUserRole = (token) => {
    const user = getDecodedToken(token);
    return user ? user.role : null;
};

export const getUserObjectId = (token) => {
    const user = getDecodedToken(token);
    return user ? user.object_id : null;
};

export const hasAccess = (token, allowedRoles = ['admin', 'global_hr', 'local_hr'], targetObjectId = null) => {
    const user = getDecodedToken(token);
    
    if (!user) return false;

    if (!allowedRoles.includes(user.role)) {
        return false;
    }

    if (user.role === 'local_hr' && targetObjectId) {
        if (String(user.object_id) !== String(targetObjectId)) {
            return false;
        }
    }

    return true;
};