Fullstack Chat Application
==========================

Додаток реалізує повний функціонал чату в реальному часі, включаючи:

*   Створення, Редагування та Видалення чатів
    
*   Надсилання повідомлень
    
*   Автоматичні відповіді від бота (з використанням dummyjson.com)
    
*   Оновлення в реальному часі через WebSockets
    
*   Функція "Рандомного Бота" для надсилання повідомлень у випадкові чати

Стек Технологій
---------------

*   **Frontend:** React (Vite)
    
*   **Backend:** Node.js (Express.js)
    
*   **Database:** MongoDB Atlas
    
*   **Real-time:** WebSockets (ws)
    

Посилання на Живий Проєкт
-------------------------

*   https://chat-bot-test-sandy.vercel.app/
    
*   https://chatbot-test-yf0t.onrender.com/
    

Як запустити локально
---------------------

1.  git clone https://github.com/SofiaDivine/ChatBot_Test/
cd ChatBot_Test
    
2.  cd backend
npm install
    
    *   Створіть файл .env у папці backend.
        
    *   Додайте свій MONGO\_URI (рядок підключення до MongoDB Atlas).
MONGO\_URI=mongodb+srv://...PORT=5000
        
4.  cd ../frontend
5.  npm install
    
6.  **Запустити обидва сервери:**
    
    *   У першому терміналі: cd backend && npm run dev
        
    *   У другому терміналі: cd frontend && npm run dev
        
7.  Відкрити http://localhost:5173 у браузері.
