/*
  Настройки сайта RqJey Mods.
  1. Впиши свой GitHub username в owner.
  2. Проверь названия репозиториев в поле repo у каждого проекта.
  3. Загружай .jar в GitHub Releases — сайт сам подхватит версии.
*/
window.SITE_CONFIG = {
  owner: "YOUR_GITHUB_USERNAME",
  projects: [
    {
      id: "itemly",
      name: "Itemly",
      repo: "Itemly-Mod",
      icon: "✳",
      category: "Персонализация",
      description: "Локальное переименование предметов и изменение цвета отображаемого названия. Подходит и для предметов, и для фона.",
      minecraft: "26.3",
      accent: "violet",
      features: ["Локальные названия предметов", "Цвет названия", "Настройка через инвентарь"]
    },
    {
      id: "nearyou",
      name: "NearYou",
      repo: "NearYou",
      icon: "⌖",
      category: "Навигация",
      description: "Поиск игроков на карте сервера, просмотр координат и удобная навигация по найденным игрокам.",
      minecraft: "26.3",
      accent: "blue",
      features: ["Поиск игроков", "Координаты игроков", "Поддержка онлайн-карт"]
    },
    {
      id: "dropguard",
      name: "DropGuard",
      repo: "DropGuard",
      icon: "◇",
      category: "Защита",
      description: "Защита от случайного подбора выбранных предметов и управление собственным списком блокировки.",
      minecraft: "26.2–26.3",
      accent: "green",
      features: ["Блокировка подбора", "Список предметов", "Настройка горячей клавишей"]
    },
    {
      id: "friendhub",
      name: "FriendHub",
      repo: "FriendHub",
      icon: "⌘",
      category: "Общение",
      description: "Система друзей, личные сообщения и приглашения в голосовой чат — всё в одном удобном меню.",
      minecraft: "26.2–26.3",
      accent: "purple",
      features: ["Список друзей", "Личные сообщения", "Голосовой чат"]
    },
    {
      id: "fastcmd",
      name: "FastCmd",
      repo: "FastCmd",
      icon: "↗",
      category: "Инструменты",
      description: "Колесо быстрого доступа к командам, собственные команды и удобное управление страницами.",
      minecraft: "26.3",
      accent: "orange",
      features: ["Колесо команд", "Свои команды", "Несколько страниц"]
    }
  ]
};
