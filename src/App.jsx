// src/App.jsx
import React from 'react';
import './App.css';
import Info from './components/Info.jsx';
import Data from './components/Data.jsx';

const App = () => {
    return (
        <div className="wrapper">
            <div className="main main-col">   {/* 👈 добавили класс для колонок */}
                <section className="info">
                    <Info />
                </section>

                <section className="form form-under-hero">
                    <Data />
                </section>
            </div>
        </div>
    );
};

export default App;
