import { type CitationSource, Citations, SourceStack } from '@/components/ui/citations'

const sources: CitationSource[] = [
  {
    id: 'nasa',
    title: 'Why is the sky blue?',
    url: 'https://spaceplace.example.gov/blue-sky',
    snippet:
      'Blue light is scattered in all directions by the tiny molecules of air in Earth’s atmosphere.',
  },
  {
    id: 'met',
    title: 'Sunsets and the colour of the sky',
    url: 'https://www.weather.example.uk/sunsets',
    snippet: 'At sunset, light travels through more air, so most of the blue is scattered away.',
  },
  {
    id: 'phys',
    title: 'Rayleigh scattering explained',
    url: 'https://physics.example.org/rayleigh',
    snippet:
      'Scattering grows with the fourth power of frequency, so violet and blue scatter most.',
  },
]

export default function CitationsDemo() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <SourceStack sources={sources} />
      <Citations
        sources={sources}
        segments={[
          {
            text: 'The sky looks blue because air scatters short, blue wavelengths far more than red ones.',
            sources: ['nasa', 'phys'],
          },
          {
            text: 'Violet scatters even more, but our eyes are less sensitive to it.',
            sources: ['phys'],
          },
          {
            text: 'At sunset the light crosses more air, so the blue is scattered away and reds remain.',
            sources: ['met'],
          },
        ]}
      />
    </div>
  )
}
