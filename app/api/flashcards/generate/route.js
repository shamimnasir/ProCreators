import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini with Emergent LLM key
const genAI = new GoogleGenerativeAI(process.env.EMERGENT_LLM_KEY)

// Comprehensive flashcard content database by topic/category (fallback)
const FLASHCARD_DATABASE = {
  // VOCABULARY
  vocabulary: {
    easy: [
      { front: 'Happy', back: 'Feeling or showing pleasure or contentment' },
      { front: 'Sad', back: 'Feeling or showing sorrow; unhappy' },
      { front: 'Big', back: 'Of considerable size, extent, or intensity' },
      { front: 'Small', back: 'Of a size that is less than normal or usual' },
      { front: 'Fast', back: 'Moving or capable of moving at high speed' },
      { front: 'Slow', back: 'Moving or operating at a low speed' },
      { front: 'Hot', back: 'Having a high degree of heat or temperature' },
      { front: 'Cold', back: 'Of or at a low temperature' },
      { front: 'New', back: 'Not existing before; recently made or discovered' },
      { front: 'Old', back: 'Having lived for a long time; no longer young' }
    ],
    medium: [
      { front: 'Ambiguous', back: 'Open to more than one interpretation; unclear' },
      { front: 'Benevolent', back: 'Well meaning and kindly; charitable' },
      { front: 'Candid', back: 'Truthful and straightforward; frank' },
      { front: 'Diligent', back: 'Having or showing care in one\'s work or duties' },
      { front: 'Eloquent', back: 'Fluent or persuasive in speaking or writing' },
      { front: 'Frugal', back: 'Sparing or economical with money or food' },
      { front: 'Gregarious', back: 'Fond of company; sociable' },
      { front: 'Humble', back: 'Having a modest view of one\'s importance' },
      { front: 'Innovative', back: 'Introducing new ideas; original and creative' },
      { front: 'Jovial', back: 'Cheerful and friendly' }
    ],
    hard: [
      { front: 'Ephemeral', back: 'Lasting for a very short time; transitory' },
      { front: 'Quintessential', back: 'Representing the most perfect example of a quality' },
      { front: 'Ubiquitous', back: 'Present, appearing, or found everywhere' },
      { front: 'Sycophant', back: 'A person who acts obsequiously toward someone important' },
      { front: 'Obfuscate', back: 'To render obscure, unclear, or unintelligible' },
      { front: 'Perfunctory', back: 'Carried out with minimum effort or reflection' },
      { front: 'Recalcitrant', back: 'Having an obstinately uncooperative attitude' },
      { front: 'Supercilious', back: 'Behaving as if one is superior to others' },
      { front: 'Truculent', back: 'Eager or quick to argue or fight; aggressively defiant' },
      { front: 'Verisimilitude', back: 'The appearance of being true or real' }
    ]
  },

  // SPANISH
  spanish: {
    easy: [
      { front: 'Hola', back: 'Hello' },
      { front: 'Adiós', back: 'Goodbye' },
      { front: 'Gracias', back: 'Thank you' },
      { front: 'Por favor', back: 'Please' },
      { front: 'Sí', back: 'Yes' },
      { front: 'No', back: 'No' },
      { front: 'Agua', back: 'Water' },
      { front: 'Comida', back: 'Food' },
      { front: 'Casa', back: 'House' },
      { front: 'Familia', back: 'Family' },
      { front: 'Amigo', back: 'Friend' },
      { front: 'Bueno', back: 'Good' },
      { front: 'Malo', back: 'Bad' },
      { front: 'Grande', back: 'Big' },
      { front: 'Pequeño', back: 'Small' }
    ],
    medium: [
      { front: '¿Cómo estás?', back: 'How are you?' },
      { front: 'Me llamo...', back: 'My name is...' },
      { front: '¿Dónde está...?', back: 'Where is...?' },
      { front: '¿Cuánto cuesta?', back: 'How much does it cost?' },
      { front: 'No entiendo', back: 'I don\'t understand' },
      { front: '¿Puede ayudarme?', back: 'Can you help me?' },
      { front: 'Tengo hambre', back: 'I am hungry' },
      { front: 'Estoy cansado', back: 'I am tired' },
      { front: 'Me gusta', back: 'I like it' },
      { front: 'No me gusta', back: 'I don\'t like it' }
    ],
    hard: [
      { front: 'Aunque llueva, iré', back: 'Even if it rains, I will go' },
      { front: 'Si hubiera sabido', back: 'If I had known' },
      { front: 'Ojalá pudiera', back: 'I wish I could' },
      { front: 'A pesar de que', back: 'In spite of the fact that' },
      { front: 'Sin embargo', back: 'However/Nevertheless' },
      { front: 'Por lo tanto', back: 'Therefore' },
      { front: 'En cuanto llegue', back: 'As soon as I arrive' },
      { front: 'Antes de que', back: 'Before (+ subjunctive)' },
      { front: 'Después de que', back: 'After (+ subjunctive)' },
      { front: 'A menos que', back: 'Unless' }
    ]
  },

  // MATH
  math: {
    easy: [
      { front: '5 + 3', back: '8' },
      { front: '10 - 4', back: '6' },
      { front: '6 × 7', back: '42' },
      { front: '24 ÷ 6', back: '4' },
      { front: '9 × 9', back: '81' },
      { front: '15 + 8', back: '23' },
      { front: '100 - 37', back: '63' },
      { front: '8 × 8', back: '64' },
      { front: '72 ÷ 8', back: '9' },
      { front: '7 × 6', back: '42' }
    ],
    medium: [
      { front: 'Area of a Rectangle', back: 'Length × Width' },
      { front: 'Area of a Triangle', back: '½ × Base × Height' },
      { front: 'Area of a Circle', back: 'πr² (pi × radius squared)' },
      { front: 'Circumference of Circle', back: '2πr (2 × pi × radius)' },
      { front: 'Pythagorean Theorem', back: 'a² + b² = c²' },
      { front: 'Volume of a Cube', back: 'side³' },
      { front: 'Perimeter of Rectangle', back: '2(length + width)' },
      { front: 'Volume of Cylinder', back: 'πr²h' },
      { front: 'Slope Formula', back: '(y₂ - y₁) / (x₂ - x₁)' },
      { front: 'Distance Formula', back: '√[(x₂-x₁)² + (y₂-y₁)²]' }
    ],
    hard: [
      { front: 'Quadratic Formula', back: 'x = (-b ± √(b²-4ac)) / 2a' },
      { front: 'Derivative of xⁿ', back: 'nxⁿ⁻¹' },
      { front: 'Integral of xⁿ', back: 'xⁿ⁺¹/(n+1) + C' },
      { front: 'Derivative of sin(x)', back: 'cos(x)' },
      { front: 'Derivative of cos(x)', back: '-sin(x)' },
      { front: 'Euler\'s Identity', back: 'e^(iπ) + 1 = 0' },
      { front: 'Law of Cosines', back: 'c² = a² + b² - 2ab·cos(C)' },
      { front: 'Sum of Geometric Series', back: 'a(1-rⁿ)/(1-r)' },
      { front: 'Binomial Theorem', back: '(a+b)ⁿ = Σ C(n,k)aⁿ⁻ᵏbᵏ' },
      { front: 'Chain Rule', back: 'd/dx[f(g(x))] = f\'(g(x))·g\'(x)' }
    ]
  },

  // SCIENCE
  science: {
    easy: [
      { front: 'What is H₂O?', back: 'Water' },
      { front: 'What planet is closest to the Sun?', back: 'Mercury' },
      { front: 'What is the largest organ in the human body?', back: 'Skin' },
      { front: 'How many legs does an insect have?', back: 'Six' },
      { front: 'What gas do plants produce?', back: 'Oxygen' },
      { front: 'What is the center of an atom called?', back: 'Nucleus' },
      { front: 'How many bones are in the human body?', back: '206' },
      { front: 'What is the boiling point of water?', back: '100°C or 212°F' },
      { front: 'What is the freezing point of water?', back: '0°C or 32°F' },
      { front: 'What causes tides?', back: 'The Moon\'s gravitational pull' }
    ],
    medium: [
      { front: 'What is photosynthesis?', back: 'Process where plants convert sunlight, water, and CO₂ into glucose and oxygen' },
      { front: 'What are the three states of matter?', back: 'Solid, Liquid, Gas' },
      { front: 'What is Newton\'s First Law?', back: 'An object at rest stays at rest; an object in motion stays in motion (Law of Inertia)' },
      { front: 'What is the formula for speed?', back: 'Speed = Distance ÷ Time' },
      { front: 'What is DNA?', back: 'Deoxyribonucleic acid - the molecule that carries genetic information' },
      { front: 'What is the mitochondria?', back: 'The powerhouse of the cell - produces energy (ATP)' },
      { front: 'What is an element?', back: 'A pure substance made of only one type of atom' },
      { front: 'What is a compound?', back: 'A substance made of two or more different elements chemically combined' },
      { front: 'What is the pH scale?', back: 'Measures acidity/alkalinity from 0 (most acidic) to 14 (most alkaline)' },
      { front: 'What is kinetic energy?', back: 'Energy of motion: KE = ½mv²' }
    ],
    hard: [
      { front: 'What is Schrödinger\'s equation used for?', back: 'Describes how the quantum state of a physical system changes over time' },
      { front: 'What is the Heisenberg Uncertainty Principle?', back: 'Cannot simultaneously know exact position and momentum of a particle' },
      { front: 'What is entropy?', back: 'Measure of disorder in a system; always increases in isolated systems' },
      { front: 'What is the strong nuclear force?', back: 'Force that holds protons and neutrons together in atomic nuclei' },
      { front: 'What is CRISPR?', back: 'Gene editing technology using Cas9 protein to modify DNA sequences' },
      { front: 'What is the Krebs cycle?', back: 'Series of chemical reactions in cellular respiration that generates ATP' },
      { front: 'What is quantum entanglement?', back: 'Particles become correlated so measuring one instantly affects the other' },
      { front: 'What is special relativity?', back: 'Einstein\'s theory: speed of light is constant, time dilates at high speeds' },
      { front: 'What is the Drake equation?', back: 'Estimates number of active extraterrestrial civilizations in the Milky Way' },
      { front: 'What is the Higgs boson?', back: 'Particle that gives other particles mass through the Higgs field' }
    ]
  },

  // HISTORY
  history: {
    easy: [
      { front: 'When did World War II end?', back: '1945' },
      { front: 'Who was the first US President?', back: 'George Washington' },
      { front: 'In what year did Columbus reach America?', back: '1492' },
      { front: 'Who wrote the Declaration of Independence?', back: 'Thomas Jefferson' },
      { front: 'What year did the Titanic sink?', back: '1912' },
      { front: 'Who was the first man on the moon?', back: 'Neil Armstrong (1969)' },
      { front: 'What was the Berlin Wall?', back: 'Wall dividing East and West Berlin (1961-1989)' },
      { front: 'Who was Martin Luther King Jr.?', back: 'Civil rights leader who advocated nonviolent resistance' },
      { front: 'When did the American Civil War begin?', back: '1861' },
      { front: 'Who was Abraham Lincoln?', back: '16th US President who ended slavery' }
    ],
    medium: [
      { front: 'What caused World War I?', back: 'Assassination of Archduke Franz Ferdinand, alliance systems, militarism, nationalism' },
      { front: 'What was the Renaissance?', back: 'Cultural rebirth in Europe (14th-17th century) emphasizing art, science, and humanism' },
      { front: 'What was the Industrial Revolution?', back: 'Transition from hand production to machines (late 1700s-mid 1800s)' },
      { front: 'What was the Cold War?', back: 'Political tension between USA and USSR (1947-1991) without direct military conflict' },
      { front: 'What was the French Revolution?', back: 'Overthrow of French monarchy (1789-1799), led to democracy and Napoleon' },
      { front: 'What was the Magna Carta?', back: '1215 document limiting English king\'s power, foundation of constitutional law' },
      { front: 'What was the Black Death?', back: 'Bubonic plague (1347-1351) that killed 30-60% of Europe\'s population' },
      { front: 'Who was Alexander the Great?', back: 'Macedonian king who created one of history\'s largest empires by age 30' },
      { front: 'What was the Roman Empire?', back: 'Ancient civilization centered in Rome (27 BC - 476 AD) that shaped Western culture' },
      { front: 'What was the Silk Road?', back: 'Ancient trade route connecting East Asia and the Mediterranean' }
    ],
    hard: [
      { front: 'What was the Treaty of Westphalia?', back: '1648 treaties ending Thirty Years\' War, established modern state sovereignty' },
      { front: 'What was the Congress of Vienna?', back: '1814-1815 meeting to reorganize Europe after Napoleon, established balance of power' },
      { front: 'What was the Meiji Restoration?', back: '1868 political revolution in Japan, ending feudalism and modernizing the country' },
      { front: 'What was the Scramble for Africa?', back: 'European colonization of Africa (1881-1914), formalized at Berlin Conference' },
      { front: 'What was the Balfour Declaration?', back: '1917 British statement supporting Jewish homeland in Palestine' },
      { front: 'What was the Marshall Plan?', back: 'US program providing aid to rebuild Western Europe after WWII' },
      { front: 'What was the Sykes-Picot Agreement?', back: '1916 secret agreement dividing Ottoman Empire between Britain and France' },
      { front: 'What was the Taiping Rebellion?', back: 'Chinese civil war (1850-1864) that killed 20-30 million people' },
      { front: 'What was the Reconquista?', back: 'Christian reconquest of Iberian Peninsula from Muslims (718-1492)' },
      { front: 'What was the Opium Wars?', back: 'Conflicts between China and Britain (1839-1860) over trade and sovereignty' }
    ]
  },

  // KIDS LEARNING
  kids: {
    easy: [
      { front: 'What color is the sky?', back: 'Blue' },
      { front: 'How many days in a week?', back: 'Seven' },
      { front: 'What animal says "moo"?', back: 'Cow' },
      { front: 'What shape has 3 sides?', back: 'Triangle' },
      { front: 'What color is grass?', back: 'Green' },
      { front: 'How many months in a year?', back: 'Twelve' },
      { front: 'What is 2 + 2?', back: '4' },
      { front: 'What animal has a trunk?', back: 'Elephant' },
      { front: 'What fruit is yellow and curved?', back: 'Banana' },
      { front: 'What is the opposite of hot?', back: 'Cold' },
      { front: 'What do bees make?', back: 'Honey' },
      { front: 'How many legs does a spider have?', back: 'Eight' }
    ],
    medium: [
      { front: 'What are the primary colors?', back: 'Red, Blue, Yellow' },
      { front: 'What is the largest planet?', back: 'Jupiter' },
      { front: 'What do you call a baby dog?', back: 'Puppy' },
      { front: 'What is the capital of France?', back: 'Paris' },
      { front: 'How many continents are there?', back: 'Seven' },
      { front: 'What is the opposite of addition?', back: 'Subtraction' },
      { front: 'What ocean is the largest?', back: 'Pacific Ocean' },
      { front: 'What do caterpillars turn into?', back: 'Butterflies' },
      { front: 'What is a group of lions called?', back: 'A pride' },
      { front: 'What are the four seasons?', back: 'Spring, Summer, Fall, Winter' }
    ],
    hard: [
      { front: 'What is the smallest planet?', back: 'Mercury' },
      { front: 'What is the capital of Australia?', back: 'Canberra' },
      { front: 'How many teeth does an adult human have?', back: '32' },
      { front: 'What is the largest mammal?', back: 'Blue Whale' },
      { front: 'What is the hardest natural substance?', back: 'Diamond' },
      { front: 'What is the chemical symbol for gold?', back: 'Au' },
      { front: 'How many Great Lakes are there?', back: 'Five' },
      { front: 'What is the tallest mountain?', back: 'Mount Everest' },
      { front: 'What is the fastest land animal?', back: 'Cheetah' },
      { front: 'What is the longest river?', back: 'Nile River' }
    ]
  },

  // TRIVIA
  trivia: {
    easy: [
      { front: 'What is the largest country by area?', back: 'Russia' },
      { front: 'What is the smallest country?', back: 'Vatican City' },
      { front: 'What is the most spoken language?', back: 'English (by total speakers)' },
      { front: 'What year was the iPhone released?', back: '2007' },
      { front: 'Who painted the Mona Lisa?', back: 'Leonardo da Vinci' },
      { front: 'What is the capital of Japan?', back: 'Tokyo' },
      { front: 'How many strings does a guitar have?', back: 'Six (standard guitar)' },
      { front: 'What is the currency of the UK?', back: 'British Pound (£)' },
      { front: 'Who wrote Harry Potter?', back: 'J.K. Rowling' },
      { front: 'What sport uses a puck?', back: 'Ice Hockey' }
    ],
    medium: [
      { front: 'What is the deepest ocean trench?', back: 'Mariana Trench' },
      { front: 'What company created Android?', back: 'Google' },
      { front: 'What is the largest desert?', back: 'Sahara Desert' },
      { front: 'Who invented the telephone?', back: 'Alexander Graham Bell' },
      { front: 'What is the capital of Canada?', back: 'Ottawa' },
      { front: 'How many keys on a standard piano?', back: '88' },
      { front: 'What is the national animal of Australia?', back: 'Red Kangaroo' },
      { front: 'Who founded Microsoft?', back: 'Bill Gates and Paul Allen' },
      { front: 'What is the largest organ inside the body?', back: 'Liver' },
      { front: 'What year did the Berlin Wall fall?', back: '1989' }
    ],
    hard: [
      { front: 'What is the rarest blood type?', back: 'AB Negative' },
      { front: 'What is the national flower of Japan?', back: 'Cherry Blossom (Sakura)' },
      { front: 'Who invented the World Wide Web?', back: 'Tim Berners-Lee' },
      { front: 'What is the longest bone in the body?', back: 'Femur (thigh bone)' },
      { front: 'What year was the UN founded?', back: '1945' },
      { front: 'What is the only country to border the UK?', back: 'Ireland' },
      { front: 'Who was the first woman in space?', back: 'Valentina Tereshkova (1963)' },
      { front: 'What is the smallest bone in the body?', back: 'Stapes (in the ear)' },
      { front: 'What country has the most islands?', back: 'Sweden (over 267,000)' },
      { front: 'What is the speed of light?', back: 'Approximately 299,792 km/s' }
    ]
  }
}

// Map topics to categories
function findBestCategory(topic) {
  const topicLower = topic.toLowerCase()
  
  if (topicLower.includes('spanish') || topicLower.includes('french') || topicLower.includes('language')) {
    return 'spanish'
  }
  if (topicLower.includes('math') || topicLower.includes('algebra') || topicLower.includes('geometry') || topicLower.includes('calculus')) {
    return 'math'
  }
  if (topicLower.includes('science') || topicLower.includes('physics') || topicLower.includes('chemistry') || topicLower.includes('biology')) {
    return 'science'
  }
  if (topicLower.includes('history') || topicLower.includes('war') || topicLower.includes('president')) {
    return 'history'
  }
  if (topicLower.includes('kid') || topicLower.includes('child') || topicLower.includes('elementary') || topicLower.includes('basic')) {
    return 'kids'
  }
  if (topicLower.includes('trivia') || topicLower.includes('fun') || topicLower.includes('general')) {
    return 'trivia'
  }
  if (topicLower.includes('vocab') || topicLower.includes('word') || topicLower.includes('english')) {
    return 'vocabulary'
  }
  
  // Default to trivia
  return 'trivia'
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { topic, count = 20, difficulty = 'medium', category } = body
    
    // Find best matching category
    const bestCategory = category || findBestCategory(topic)
    
    // Get flashcards from database
    const categoryData = FLASHCARD_DATABASE[bestCategory] || FLASHCARD_DATABASE.trivia
    const difficultyData = categoryData[difficulty] || categoryData.medium
    
    // Shuffle and select cards
    const shuffled = [...difficultyData].sort(() => Math.random() - 0.5)
    const selectedCards = shuffled.slice(0, Math.min(count, shuffled.length))
    
    // If we need more cards than available, repeat with variations
    const flashcards = []
    for (let i = 0; i < count; i++) {
      const card = selectedCards[i % selectedCards.length]
      flashcards.push({
        front: card.front,
        back: card.back
      })
    }
    
    return NextResponse.json({
      success: true,
      flashcards,
      category: bestCategory,
      difficulty
    })
    
  } catch (error) {
    console.error('Flashcard generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
