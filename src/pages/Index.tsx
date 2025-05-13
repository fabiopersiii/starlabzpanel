import { useState } from "react";
import { LoginScreen } from "@/components/LoginScreen";
import { Dashboard } from "@/components/Dashboard";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    phone: "",
    username: "",
    password: ""
  });
  const [instanceData, setInstanceData] = useState(null);

  const handleLogin = (username: string, phone: string, data: any) => {
    setUserData({
      name: username,
      phone: phone,
      username: data.username || username, // Usando o username do login
      password: data.password || "" // Armazenando a senha para uso no webhook
    });
    setInstanceData(data);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData({ 
      name: "", 
      phone: "", 
      username: "", 
      password: "" 
    });
    setInstanceData(null);
  };

  return (
    <div className="min-h-screen">
      {!isLoggedIn ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <Dashboard 
          userData={userData} 
          initialInstanceData={instanceData}
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
};

export default Index;
