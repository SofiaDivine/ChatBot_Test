export const getInitials = (firstName, lastName) => {
  if (!firstName || !lastName) return '??';
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  });
};