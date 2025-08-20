import { Link } from "wouter";
import { Film } from "lucide-react";

export default function Footer() {
  const gameLinks = [
    { href: "/how-to-play", label: "Как играть" },
    { href: "/rules", label: "Правила" },
    { href: "/game-modes", label: "Режимы игры" },
    { href: "/leaderboard", label: "Рейтинг" },
  ];

  const supportLinks = [
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Связаться с нами" },
    { href: "/report-issue", label: "Сообщить о проблеме" },
    { href: "/suggest-question", label: "Предложить вопрос" },
  ];

  const legalLinks = [
    { href: "/privacy", label: "Политика конфиденциальности" },
    { href: "/terms", label: "Пользовательское соглашение" },
    { href: "/usage", label: "Условия использования" },
  ];

  const socialLinks = [
    { href: "#", label: "VK", icon: "fab fa-vk", color: "text-game-purple" },
    { href: "#", label: "Telegram", icon: "fab fa-telegram", color: "text-game-blue" },
    { href: "#", label: "Discord", icon: "fab fa-discord", color: "text-game-green" },
  ];

  return (
    <footer className="bg-game-dark border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <Link href="/" className="flex items-center mb-4">
              <div className="text-2xl font-bold text-game-purple flex items-center">
                <Film className="mr-2" />
                KinoGame
              </div>
            </Link>
            <p className="text-gray-400 mb-4">
              Самая увлекательная игра о кино. Проверь свои знания и соревнуйся с друзьями!
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className={`text-gray-400 hover:${social.color} transition-colors`}
                  aria-label={social.label}
                >
                  <i className={`${social.icon} text-xl`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Game Links */}
          <div>
            <h4 className="font-semibold mb-4">Игра</h4>
            <ul className="space-y-2">
              {gameLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Поддержка</h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4">Юридическая информация</h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 KinoGame. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
