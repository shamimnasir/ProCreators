'use client'
import { TextGeneratorTemplate } from '@/components/shared/TextGeneratorTemplate'
import { Grid2x2 } from 'lucide-react'

export default function PuzzleBookPage() {
  return (
    <TextGeneratorTemplate
      config={{
        toolId: 'puzzle-book',
        name: 'Themed Puzzle Book Generator',
        icon: Grid2x2,
        tagline: 'Themed word-search puzzle books. KDP research shows themed puzzles outsell generic 4:1.',
        apiPath: '/api/puzzle-book/generate',
        bgGradient: 'from-indigo-500 to-blue-600',
        cta: 'Generate Puzzle Book (8 credits)',
        exampleOutput: 'Complete word-search puzzle book with:\n\u2022 Foreword + how-to-play\n\u2022 20-100 themed puzzles\n\u2022 Themed word list per puzzle\n\u2022 Printable letter grids (auto-generated)\n\u2022 KDP-ready formatting',
        fields: [
          { id: 'theme', label: 'Theme', required: true, placeholder: 'e.g. K-pop stars, Dinosaurs, Cats & Kittens, Marine Life, Christmas, Harry Potter, 90s Cartoons', hint: 'Specific themes convert best ("K-pop" > "Music")' },
          { id: 'puzzleCount', label: 'Number of puzzles', type: 'select', options: [
            { value: '20', label: '20 puzzles \u2014 pocket book ($6\u2013$9)' },
            { value: '50', label: '50 puzzles \u2014 standard book ($9\u2013$14)' },
            { value: '100', label: '100 puzzles \u2014 mega book ($14\u2013$19)' },
          ]},
          { id: 'difficulty', label: 'Difficulty', type: 'select', options: [
            { value: 'Easy', label: 'Easy (8-12 words per puzzle)' },
            { value: 'Medium', label: 'Medium (12-16 words)' },
            { value: 'Hard', label: 'Hard (16-22 words)' },
          ]},
          { id: 'audience', label: 'Target audience', type: 'select', options: [
            { value: 'Kids (ages 6-12)', label: 'Kids (ages 6-12)' },
            { value: 'Teens (13-17)', label: 'Teens (13-17)' },
            { value: 'Adults', label: 'Adults' },
            { value: 'Seniors (large-print)', label: 'Seniors (large-print)' },
          ]},
        ],
      }}
    />
  )
}
