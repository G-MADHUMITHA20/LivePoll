export const getVoterId = (): string => {
  let voterId = localStorage.getItem('voter_id');
  if (!voterId) {
    voterId = 'voter_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('voter_id', voterId);
  }
  return voterId;
};
