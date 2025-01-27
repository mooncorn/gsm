export const apiUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080';

export const navigationItems = [
  { path: "containers", label: "Containers", icon: "TbBox" },
  { path: "images", label: "Images", icon: "TbCloud" },
  { path: "files", label: "Files", icon: "TbFolder" },
  { path: "users", label: "Access", icon: "TbUsers" },
]; 