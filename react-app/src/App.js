import React, { useEffect, useRef } from "react";
import AuthService from "./services/auth.service";
import Router from "./routes";
import { useNavigate } from 'react-router-dom';

const App = () => {
  const alanBtnContainer = useRef();
  const navigate = useNavigate();
  const alanBtnInitialized = useRef(false);

  useEffect(() => {
    if (alanBtnInitialized.current) return;
    alanBtnInitialized.current = true;

    const key = process.env.REACT_APP_ALAN_AI_KEY;
    if (!key) return;

    try {
      const alanBtn = require("@alan-ai/alan-sdk-web").default;
      alanBtn({
        key,
        rootEl: alanBtnContainer.current,
        onCommand: (commandData) => {
          if (commandData.command === "showHomePage") navigate("/", { replace: true });
          if (commandData.command === "showLoginPage") navigate("/login", { replace: true });
          if (commandData.command === "showSignupPage") navigate("/role", { replace: true });
          if (commandData.command === "showUploadPage") {
            navigate("/upload", { replace: true });
          }
        },
      });
    } catch (e) {
      console.warn("Alan AI failed to initialize:", e.message);
    }
  }, [navigate]);

  return (
    <div>
      <Router />
      <div className="App">
        <div className="alan" ref={alanBtnContainer}></div>
      </div>
    </div>
  );
};

export default App;
