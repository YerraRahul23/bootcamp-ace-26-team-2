import { getDocuments } from './documents';

// TODO: Replace with actual API integration

export async function fetchProfile() {
  // TODO: Connect to backend API endpoint for fetching user profile
  // const response = await fetch('/api/profile');
  // return response.json();
  return {
    id: null,
    name: null,
    email: null,
    role: null,
    memberSince: null,
    lastLogin: null,
    emailVerified: null,
    accountStatus: null,
    passwordLastChanged: null,
    twoFactorEnabled: null,
  };
}

export async function fetchProfileStats() {
  const docs = getDocuments();
  return {
    contractsUploaded: docs.length || null,
    questionsAsked: null,
    conversations: null,
    lastContractUploaded: docs.length > 0 ? docs[0].name : null,
  };
}

export async function changePassword(currentPassword, newPassword) {
  // TODO: Connect to backend API endpoint for changing password
  // const response = await fetch('/api/profile/password', {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ currentPassword, newPassword }),
  // });
  // return response.json();
  return null;
}

export async function deleteAccount() {
  // TODO: Connect to backend API endpoint for deleting account
  // const response = await fetch('/api/profile', { method: 'DELETE' });
  // return response.json();
  return null;
}
