const Auth = (() => {
  const USERS_KEY = "users";
  const SESSION_KEY = "session";

  const readUsers = () => {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
      return [];
    }
  };

  const writeUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const uid = () => {
    return "u_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  };

  const hash = async (text) => {
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const setSession = (userId) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, at: Date.now() }));
  };

  const getSession = () => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  };

  const logout = () => localStorage.removeItem(SESSION_KEY);

  const getUserById = (id) => readUsers().find(u => u.id === id);

  const signup = (name, email, password) => {
    const users = readUsers();
    if (!name || !email || !password) return { ok: false, message: "Please fill in all fields." };
    if (!email.includes("@")) return { ok: false, message: "Email looks invalid." };
    if (password.length < 6) return { ok: false, message: "Password must be at least 6 characters." };

    const exists = users.some(u => u.email === email);
    if (exists) return { ok: false, message: "This email is already used." };

    return (async () => {
      const passwordHash = await hash(password);
      const user = { id: uid(), name, email, passwordHash, createdAt: new Date().toISOString() };
      users.push(user);
      writeUsers(users);
      setSession(user.id);
      return { ok: true };
    })();
  };

  const login = (email, password) => {
    const users = readUsers();
    const user = users.find(u => u.email === email);
    if (!user) return { ok: false, message: "No account found for this email." };

    return (async () => {
      const passwordHash = await hash(password);
      if (passwordHash !== user.passwordHash) return { ok: false, message: "Wrong password." };
      setSession(user.id);
      return { ok: true };
    })();
  };

  return { signup, login, logout, getSession, getUserById };
})();
