

'use client';
import React from 'react';
import type { Organization, Person, Work } from '@/types';
import { Button } from '../ui/button';
import Image from 'next/image';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { ThemeApplier } from '../theme/ThemeApplier';
import { useBookTheme } from '../theme/BookThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

function getEmbeddableMapUrl(url: string | undefined): string | null {
  if (!url) return null;
  // Look for coordinates in the URL
  const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    const lat = coordMatch[1];
    const lon = coordMatch[2];
    return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${lat},${lon}`;
  }
  // Fallback for search queries
  const searchMatch = url.match(/search\/(.*)\/@/);
  if (searchMatch) {
    const query = searchMatch[1];
    return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${query}`;
  }
  // Fallback for place IDs
  const placeMatch = url.match(/place\/([^/]+)\//);
  if (placeMatch) {
     const place = placeMatch[1];
     return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=place_id:${place}`;
  }
  return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=India`;
}

const PersonCard = ({ person }: { person: Person }) => (
  <div className="text-center">
    {person.photoUrl && (
      <Image
        src={person.photoUrl}
        alt={person.name}
        width={128}
        height={128}
        className="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-lg"
        data-ai-hint="person portrait"
      />
    )}
    <h4 className="font-bold text-lg">{person.name}</h4>
    <p className="text-sm text-muted-foreground">{person.role}</p>
    {person.profileLink && (
      <Button asChild variant="link" size="sm">
        <a href={person.profileLink} target="_blank" rel="noopener noreferrer">View Profile</a>
      </Button>
    )}
  </div>
);

const WorkCard = ({ work }: { work: Work }) => (
    <Card className="overflow-hidden h-full flex flex-col">
        {work.coverImage && (
             <div className="relative h-48 w-full">
                <Image src={work.coverImage} alt={work.title} layout="fill" objectFit="cover" data-ai-hint="book cover"/>
            </div>
        )}
        <CardHeader>
            <CardTitle className="text-lg">{work.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-3">{work.summary}</p>
        </CardContent>
        <CardContent>
             {work.ctaHref && (
                <Button asChild>
                    <a href={work.ctaHref} target="_blank" rel="noopener noreferrer">
                        {work.ctaLabel || 'Learn More'} <ExternalLink className="ml-2 h-4 w-4"/>
                    </a>
                </Button>
            )}
        </CardContent>
    </Card>
)

export function ThemeSaraswati({ org }: { org: Organization }) {
  const { theme } = useBookTheme();
  const mapUrl = getEmbeddableMapUrl(org.contact?.googleMapsLink);

  return (
    <>
      {theme && <ThemeApplier theme={theme} />}
      <div className="font-serif bg-body-bg-color text-foreground">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md shadow-sm">
          <div className="container mx-auto p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {org.logoUrl && <Image src={org.logoUrl} alt={`${org.name} Logo`} width={50} height={50} className="h-12 w-auto object-contain"/>}
              <span className="text-2xl font-bold">{org.displayName || org.name}</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#about" className="hover:text-primary">About</a>
              {org.works && org.works.length > 0 && <a href="#works" className="hover:text-primary">Works</a>}
              {org.people && org.people.length > 0 && <a href="#team" className="hover:text-primary">Team</a>}
              <a href="#contact" className="hover:text-primary">Contact</a>
            </nav>
          </div>
        </header>

        <main>
          <section id="hero" className="relative h-[60vh] flex items-center justify-center text-center text-white bg-gray-800">
            {org.coverUrl && <Image src={org.coverUrl} alt="Cover" layout="fill" objectFit="cover" className="opacity-40" data-ai-hint="landscape building" />}
            <div className="relative z-10 p-4">
              <h1 className="text-5xl font-extrabold mb-4">{org.name}</h1>
              <p className="text-xl max-w-2xl mx-auto">{org.tagline}</p>
            </div>
          </section>

          <section id="about" className="py-20">
            <div className="container mx-auto px-6 max-w-4xl space-y-12">
              <div>
                  <h2 className="text-4xl font-bold text-center mb-10">About Us</h2>
                  <div className="prose prose-lg max-w-none prose-p:text-justify" dangerouslySetInnerHTML={{ __html: org.about?.longDescription || '' }} />
              </div>

              {org.about?.missionStatement && (
                  <div>
                      <h3 className="text-3xl font-bold text-center mb-6">Our Mission</h3>
                      <div className="prose prose-xl max-w-none text-center italic" dangerouslySetInnerHTML={{ __html: org.about.missionStatement }} />
                  </div>
              )}

              {org.about?.visionStatement && (
                  <div>
                      <h3 className="text-3xl font-bold text-center mb-6">Our Vision</h3>
                      <div className="prose prose-xl max-w-none text-center italic" dangerouslySetInnerHTML={{ __html: org.about.visionStatement }} />
                  </div>
              )}
            </div>
          </section>

          {org.works && org.works.length > 0 && (
            <section id="works" className="py-20 bg-muted/50">
                <div className="container mx-auto px-6 max-w-6xl">
                    <h2 className="text-4xl font-bold text-center mb-12">Our Works</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {org.works.map((work, index) => <WorkCard key={index} work={work} />)}
                    </div>
                </div>
            </section>
          )}

           {org.people && org.people.length > 0 && (
            <section id="team" className="py-20">
                <div className="container mx-auto px-6 max-w-5xl">
                    <h2 className="text-4xl font-bold text-center mb-12">Our Team</h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10">
                        {org.people.map((person, index) => <PersonCard key={index} person={person} />)}
                    </div>
                </div>
            </section>
          )}

          <section id="contact" className="py-20 bg-muted/50">
              <div className="container mx-auto px-6">
                <h2 className="text-4xl font-bold text-center mb-12">Contact Us</h2>
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        {mapUrl && (
                            <iframe
                                width="100%"
                                height="450"
                                className="border-0 rounded-lg shadow-lg"
                                loading="lazy"
                                allowFullScreen
                                src={mapUrl}>
                            </iframe>
                        )}
                    </div>
                    <div className="space-y-4">
                        {org.contact?.address && (
                            <div className="flex items-start gap-4">
                                <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold">Address</h4>
                                    <p className="text-muted-foreground">{org.contact.address.street}, {org.contact.address.city}, {org.contact.address.state} - {org.contact.address.pincode}, {org.contact.address.country}</p>
                                </div>
                            </div>
                        )}
                        {org.contact?.officialEmail && (
                             <div className="flex items-start gap-4">
                                <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold">Email</h4>
                                    <a href={`mailto:${org.contact.officialEmail}`} className="text-muted-foreground hover:text-primary">{org.contact.officialEmail}</a>
                                </div>
                            </div>
                        )}
                         {org.contact?.phone?.primary && (
                             <div className="flex items-start gap-4">
                                <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold">Phone</h4>
                                    <a href={`tel:${org.contact.phone.primary}`} className="text-muted-foreground hover:text-primary">{org.contact.phone.primary}</a>
                                     {org.contact.phone.alternate && <span className="text-muted-foreground">, {org.contact.phone.alternate}</span>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
              </div>
          </section>
          
        </main>

        <footer className="bg-gray-100 dark:bg-gray-800 py-10">
            <div className="container mx-auto text-center text-gray-600 dark:text-gray-300">
                <p>&copy; {new Date().getFullYear()} {org.name}. All Rights Reserved.</p>
            </div>
        </footer>
      </div>
    </>
  );
}
