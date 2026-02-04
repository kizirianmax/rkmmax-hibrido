// src/components/Navbar.jsx

import React from "react";

import { Link } from "react-router-dom";

import "./../index.css"; // usa o CSS global

const Navbar = () => {

  return (

    <nav className="navbar">

      <div className="navbar-logo">

        <Link to="/">RKMMax</Link>

      </div>

      <ul className="navbar-links">

        <li>

          <Link to="/agents">Agentes</Link>

        </li>

        <li>

          <Link to="/plans">Planos</Link>

        </li>

        <li>

          <Link to="/info">Info</Link>

        </li>

      </ul>

      <div className="navbar-actions">

        <Link to="/login" className="btn btn-outline">

          Entrar

        </Link>

        <Link to="/subscribe" className="btn btn-primary">

          Criar Conta

        </Link>

      </div>

    </nav>

  );

};

export default Navbar;