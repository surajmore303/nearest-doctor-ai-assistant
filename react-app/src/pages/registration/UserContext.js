/* eslint-disable import/no-anonymous-default-export */
import React, { createContext, useState } from "react";
export const UserContext = createContext([{}, () => {}]);

export default props => {
  
  const [state, setState] = useState({
    user: {
      username: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
    errors: {}
  });
  
  return (
    
    <UserContext.Provider value={[state, setState]}>
      {props.children}
    </UserContext.Provider>
    
  );
};
