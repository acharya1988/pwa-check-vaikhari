
'use client';
import React from 'react';
import type { Organization, Person, Work } from '@/types';
import { Button } from '../ui/button';
import Image from 'next/image';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { ThemeApplier } from '../theme/ThemeApplier';
import { useBookTheme } from '../theme/BookThemeContext';
import { Card, CardContent } from '../ui/card';

function getEmbeddableMapUrl(url: string | undefined): string | null {
  if (!url) return null;
  const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    const lat = coordMatch[1];
    const lon = coordMatch[2];
    return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${lat},${lon}`;
  }
  const searchMatch = url.match(/search\/(.*)\/@/);
  if (searchMatch) {
    const query = searchMatch[1];
    return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${query}`;
  }
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
        className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
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
    <Card className="overflow-hidden h-full flex flex-col bg-white/50 border-gray-300">
        {work.coverImage && (
             <div className="relative h-48 w-full">
                <Image src={work.coverImage} alt={work.title} layout="fill" objectFit="cover" data-ai-hint="book cover"/>
            </div>
        )}
        <CardContent className="p-4 flex-grow flex flex-col">
            <h3 className="font-semibold text-lg">{work.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-3 mt-2 flex-grow">{work.summary}</p>
            {work.ctaHref && (
                <Button asChild variant="link" className="p-0 mt-4 self-start">
                    <a href={work.ctaHref} target="_blank" rel="noopener noreferrer">
                        {work.ctaLabel || 'Learn More'} <ExternalLink className="ml-2 h-4 w-4"/>
                    </a>
                </Button>
            )}
        </CardContent>
    </Card>
)

export function ThemeWabiSabi({ org }: { org: Organization }) {
    const { theme } = useBookTheme();
    const mapUrl = getEmbeddableMapUrl(org.contact?.googleMapsLink);

  return (
    <>
      {theme && <ThemeApplier theme={theme} />}
      <div className="font-sans bg-[#F1ECE4] text-[#3a3a3a]">
        <div className="container mx-auto max-w-5xl py-16 px-6">
            <header className="text-center mb-16">
                 {org.logoUrl && <Image src={org.logoUrl} alt={`${org.name} Logo`} width={80} height={80} className="h-20 w-auto object-contain mx-auto mb-4"/>}
                <h1 className="text-4xl font-light tracking-widest uppercase">{org.name}</h1>
                <nav className="mt-6 flex items-center justify-center gap-6 text-sm uppercase tracking-wider">
                  <a href="#about" className="hover:text-primary">About</a>
                  {org.works && org.works.length > 0 && <a href="#works" className="hover:text-primary">Works</a>}
                  {org.people && org.people.length > 0 && <a href="#team" className="hover:text-primary">Team</a>}
                  <a href="#contact" className="hover:text-primary">Contact</a>
                </nav>
            </header>

            <main>
                <section id="about" className="mb-16 space-y-12">
                    <div className="prose prose-lg mx-auto text-center max-w-3xl">
                        <p className="text-xl italic mb-10">{org.tagline}</p>
                         <div dangerouslySetInnerHTML={{ __html: org.about?.longDescription || '' }} />
                    </div>
                     {org.about?.missionStatement && (
                        <div className="prose prose-xl max-w-3xl mx-auto text-center">
                            <h3 className="text-2xl font-light tracking-widest uppercase text-center mb-6">Mission</h3>
                            <div className="italic" dangerouslySetInnerHTML={{ __html: org.about.missionStatement }} />
                        </div>
                    )}

                    {org.about?.visionStatement && (
                        <div className="prose prose-xl max-w-3xl mx-auto text-center">
                           <h3 className="text-2xl font-light tracking-widest uppercase text-center mb-6">Vision</h3>
                           <div className="italic" dangerouslySetInnerHTML={{ __html: org.about.visionStatement }} />
                        </div>
                    )}
                </section>
                
                 {org.works && org.works.length > 0 && (
                  <section id="works" className="py-20">
                      <div className="container mx-auto px-6 max-w-6xl">
                          <h2 className="text-3xl font-light tracking-widest uppercase text-center mb-12">Our Works</h2>
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                              {org.works.map((work, index) => <WorkCard key={index} work={work} />)}
                          </div>
                      </div>
                  </section>
                )}

                {org.people && org.people.length > 0 && (
                  <section id="team" className="py-20">
                      <div className="container mx-auto px-6 max-w-5xl">
                          <h2 className="text-3xl font-light tracking-widest uppercase text-center mb-12">Our Team</h2>
                          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10">
                              {org.people.map((person, index) => <PersonCard key={index} person={person} />)}
                          </div>
                      </div>
                  </section>
                )}

                 <section id="contact" className="py-20">
                    <div className="container mx-auto px-6">
                      <h2 className="text-3xl font-light tracking-widest uppercase text-center mb-12">Contact Us</h2>
                      <div className="grid md:grid-cols-2 gap-12 items-center">
                          <div>
                              {mapUrl && (
                                  <iframe
                                      width="100%"
                                      height="450"
                                      className="border-0"
                                      loading="lazy"
                                      allowFullScreen
                                      src={mapUrl}>
                                  </iframe>
                              )}
                          </div>
                          <div className="space-y-6">
                              {org.contact?.address && (
                                  <div className="flex items-start gap-4">
                                      <MapPin className="h-5 w-5 mt-1 flex-shrink-0" />
                                      <div>
                                          <h4 className="font-semibold">Address</h4>
                                          <p>{org.contact.address.street}, {org.contact.address.city}, {org.contact.address.state} - {org.contact.address.pincode}, {org.contact.address.country}</p>
                                      </div>
                                  </div>
                              )}
                              {org.contact?.officialEmail && (
                                   <div className="flex items-start gap-4">
                                      <Mail className="h-5 w-5 mt-1 flex-shrink-0" />
                                      <div>
                                          <h4 className="font-semibold">Email</h4>
                                          <a href={`mailto:${org.contact.officialEmail}`} className="hover:underline">{org.contact.officialEmail}</a>
                                      </div>
                                  </div>
                              )}
                               {org.contact?.phone?.primary && (
                                   <div className="flex items-start gap-4">
                                      <Phone className="h-5 w-5 mt-1 flex-shrink-0" />
                                      <div>
                                          <h4 className="font-semibold">Phone</h4>
                                          <a href={`tel:${org.contact.phone.primary}`} className="hover:underline">{org.contact.phone.primary}</a>
                                           {org.contact.phone.alternate && <span>, {org.contact.phone.alternate}</span>}
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-gray-300 pt-8 mt-16 text-center text-gray-500 text-sm">
                 <p>&copy; {new Date().getFullYear()} {org.name}. All Rights Reserved.</p>
            </footer>
        </div>
      </div>
    </>
  );
}
