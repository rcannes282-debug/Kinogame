import { db } from "./db";
import { questions } from "@shared/schema";

const testQuestions = [
  // Общие вопросы о кино
  {
    question: "В каком году был снят фильм \"Криминальное чтиво\" Квентина Тарантино?",
    optionA: "1992",
    optionB: "1994",
    optionC: "1996",
    optionD: "1998",
    correctAnswer: "B",
    category: "general",
    difficulty: 2
  },
  {
    question: "Кто режиссер фильма \"Властелин колец: Братство кольца\"?",
    optionA: "Питер Джексон",
    optionB: "Стивен Спилберг",
    optionC: "Джордж Лукас",
    optionD: "Кристофер Нолан",
    correctAnswer: "A",
    category: "general",
    difficulty: 1
  },
  {
    question: "В каком фильме Леонардо ДиКаприо впервые получил \"Оскар\"?",
    optionA: "Титаник",
    optionB: "Волк с Уолл-стрит",
    optionC: "Выживший",
    optionD: "Начало",
    correctAnswer: "C",
    category: "general",
    difficulty: 3
  },
  {
    question: "Какой фильм открывает киновселенную Marvel?",
    optionA: "Тор",
    optionB: "Железный человек",
    optionC: "Капитан Америка",
    optionD: "Халк",
    correctAnswer: "B",
    category: "general",
    difficulty: 2
  },
  {
    question: "Кто исполнил роль Джокера в фильме \"Темный рыцарь\" (2008)?",
    optionA: "Джек Николсон",
    optionB: "Хоакин Феникс",
    optionC: "Хит Леджер",
    optionD: "Джаред Лето",
    correctAnswer: "C",
    category: "general",
    difficulty: 2
  },

  // Топ 250 фильмов
  {
    question: "Какой фильм занимает первое место в рейтинге IMDb Top 250?",
    optionA: "Побег из Шоушенка",
    optionB: "Крестный отец",
    optionC: "Темный рыцарь",
    optionD: "Список Шиндлера",
    correctAnswer: "A",
    category: "top_250",
    difficulty: 3
  },
  {
    question: "В каком году вышел фильм \"Касабланка\"?",
    optionA: "1940",
    optionB: "1942",
    optionC: "1944",
    optionD: "1946",
    correctAnswer: "B",
    category: "top_250",
    difficulty: 4
  },
  {
    question: "Кто режиссер фильма \"Вертиго\" (1958)?",
    optionA: "Орсон Уэллс",
    optionB: "Альфред Хичкок",
    optionC: "Билли Уайлдер",
    optionD: "Джон Форд",
    correctAnswer: "B",
    category: "top_250",
    difficulty: 4
  },

  // По годам
  {
    question: "В каком году вышел первый фильм \"Звездные войны\"?",
    optionA: "1975",
    optionB: "1977",
    optionC: "1979",
    optionD: "1981",
    correctAnswer: "B",
    category: "by_year",
    difficulty: 2
  },
  {
    question: "Какой фильм получил \"Оскар\" за лучший фильм в 2020 году?",
    optionA: "Паразиты",
    optionB: "1917",
    optionC: "Джокер",
    optionD: "Маленькие женщины",
    correctAnswer: "A",
    category: "by_year",
    difficulty: 2
  },

  // По жанрам
  {
    question: "Какой из этих фильмов НЕ является хоррором?",
    optionA: "Сияние",
    optionB: "Экзорцист",
    optionC: "Психо",
    optionD: "Зеленая миля",
    correctAnswer: "D",
    category: "by_genre",
    difficulty: 2
  },
  {
    question: "Кто режиссер комедии \"В джазе только девушки\" (1959)?",
    optionA: "Чарли Чаплин",
    optionB: "Билли Уайлдер",
    optionC: "Вуди Аллен",
    optionD: "Фрэнк Капра",
    correctAnswer: "B",
    category: "by_genre",
    difficulty: 3
  },

  // По актерам
  {
    question: "В скольких фильмах \"Крестный отец\" снимался Аль Пачино?",
    optionA: "1",
    optionB: "2",
    optionC: "3",
    optionD: "4",
    correctAnswer: "C",
    category: "by_actor",
    difficulty: 3
  },
  {
    question: "Какой актер сыграл роль Индианы Джонса?",
    optionA: "Харрисон Форд",
    optionB: "Том Хэнкс",
    optionC: "Кевин Костнер",
    optionD: "Мел Гибсон",
    correctAnswer: "A",
    category: "by_actor",
    difficulty: 1
  },
  {
    question: "В каком фильме Роберт Де Ниро произносит фразу \"Ты говоришь со мной?\"?",
    optionA: "Крестный отец 2",
    optionB: "Таксист",
    optionC: "Славные парни",
    optionD: "Казино",
    correctAnswer: "B",
    category: "by_actor",
    difficulty: 3
  },

  // Дополнительные сложные вопросы
  {
    question: "Какой фильм Андрея Тарковского получил \"Золотую пальмовую ветвь\" в Каннах?",
    optionA: "Андрей Рублев",
    optionB: "Солярис",
    optionC: "Сталкер",
    optionD: "Жертвоприношение",
    correctAnswer: "D",
    category: "by_festival",
    difficulty: 5
  },
  {
    question: "Кто написал сценарий к фильму \"Апокалипсис сегодня\"?",
    optionA: "Фрэнсис Форд Коппола",
    optionB: "Джон Милиус",
    optionC: "Майкл Херр",
    optionD: "Все вышеперечисленные",
    correctAnswer: "D",
    category: "general",
    difficulty: 4
  },
  {
    question: "В каком городе происходит действие фильма \"Бегущий по лезвию\" (1982)?",
    optionA: "Нью-Йорк",
    optionB: "Лос-Анджелес",
    optionC: "Сан-Франциско",
    optionD: "Чикаго",
    correctAnswer: "B",
    category: "general",
    difficulty: 3
  },
  {
    question: "Сколько \"Оскаров\" получил фильм \"Титаник\"?",
    optionA: "10",
    optionB: "11",
    optionC: "12",
    optionD: "13",
    correctAnswer: "B",
    category: "general",
    difficulty: 2
  },
  {
    question: "Какой актер НЕ снимался в фильме \"Криминальное чтиво\"?",
    optionA: "Джон Траволта",
    optionB: "Сэмюэл Л. Джексон",
    optionC: "Ума Турман",
    optionD: "Николас Кейдж",
    correctAnswer: "D",
    category: "general",
    difficulty: 2
  },
  {
    question: "Какой фильм считается первым в истории кино?",
    optionA: "Выход рабочих с фабрики Люмьер",
    optionB: "Поездка на Луну",
    optionC: "Великое ограбление поезда",
    optionD: "Рождение нации",
    correctAnswer: "A",
    category: "general",
    difficulty: 4
  }
];

export async function seedDatabase() {
  console.log("🌱 Заполняем базу данных тестовыми вопросами...");
  
  try {
    // Очищаем таблицу вопросов
    await db.delete(questions);
    
    // Добавляем тестовые вопросы
    for (const question of testQuestions) {
      await db.insert(questions).values(question);
    }
    
    console.log(`✅ Добавлено ${testQuestions.length} тестовых вопросов`);
  } catch (error) {
    console.error("❌ Ошибка при заполнении базы данных:", error);
  }
}

// Запускаем seeding если файл выполняется напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => {
    console.log("🎉 База данных успешно заполнена!");
    process.exit(0);
  }).catch((error) => {
    console.error("💥 Ошибка:", error);
    process.exit(1);
  });
}