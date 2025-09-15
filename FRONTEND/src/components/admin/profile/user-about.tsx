
'use client';

import React from 'react';
import type { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Briefcase, Star, Award as AwardIcon, Lightbulb, UserCheck, Languages, Github, Linkedin, Globe, FileText } from 'lucide-react';

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => {
    if (!React.Children.count(children)) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-primary" />
                    <span>{title}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pl-12">
                {children}
            </CardContent>
        </Card>
    );
};


const SectionItem = ({ title, subtitle, duration, children }: { title: string, subtitle: string, duration?: string, children?: React.ReactNode }) => (
    <div className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-full before:w-px before:bg-border after:absolute after:left-[-3px] after:top-2 after:h-2 after:w-2 after:rounded-full after:bg-primary">
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        {duration && <p className="text-xs text-muted-foreground">{duration}</p>}
        {children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </div>
);

export function UserAbout({ user }: { user: UserProfile }) {

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                {user.bio && (
                    <Card>
                        <CardHeader><CardTitle>About</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">{user.bio}</p></CardContent>
                    </Card>
                )}
                
                {user.experience && user.experience.length > 0 && (
                     <Section icon={Briefcase} title="Experience">
                        <div className="space-y-6">
                            {user.experience.map((exp, idx) => (
                                <SectionItem key={idx} title={exp.title} subtitle={exp.organization} duration={`${exp.startDate} - ${exp.endDate || 'Present'}`}>
                                    <p>{exp.description}</p>
                                </SectionItem>
                            ))}
                        </div>
                    </Section>
                )}
                
                {user.education && user.education.length > 0 && (
                    <Section icon={Building} title="Education">
                        <div className="space-y-6">
                            {user.education.map((edu, idx) => (
                                <SectionItem key={idx} title={`${edu.degree} in ${edu.fieldOfStudy}`} subtitle={edu.institution} duration={`${edu.startYear} - ${edu.endYear || 'Present'}`}>
                                    <p>{edu.achievements}</p>
                                </SectionItem>
                            ))}
                        </div>
                    </Section>
                )}

                {user.publications && user.publications.length > 0 && (
                    <Section icon={FileText} title="Publications">
                        <div className="space-y-4">
                            {user.publications.map((pub, idx) => (
                                <div key={idx}>
                                    <h4 className="font-semibold">{pub.title} ({pub.year})</h4>
                                    <p className="text-sm text-muted-foreground">{pub.type}</p>
                                    {pub.link && <a href={pub.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View Publication</a>}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                 {user.projects && user.projects.length > 0 && (
                    <Section icon={Lightbulb} title="Projects">
                        <div className="space-y-4">
                            {user.projects.map((proj, idx) => (
                                <SectionItem key={idx} title={proj.title} subtitle="" duration={proj.duration}>
                                    <p>{proj.description}</p>
                                    {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View Project</a>}
                                </SectionItem>
                            ))}
                        </div>
                    </Section>
                 )}

            </div>
            <div className="lg:col-span-1 space-y-6">
                 {user.links && (user.links.website || user.links.linkedin || user.links.github) && (
                    <Section icon={Globe} title="Links">
                        <ul className="space-y-2">
                            {user.links.website && <li><a href={user.links.website} className="flex items-center gap-2 hover:underline"><Globe className="h-4 w-4"/> Personal Site</a></li>}
                            {user.links.linkedin && <li><a href={user.links.linkedin} className="flex items-center gap-2 hover:underline"><Linkedin className="h-4 w-4"/> LinkedIn</a></li>}
                            {user.links.github && <li><a href={user.links.github} className="flex items-center gap-2 hover:underline"><Github className="h-4 w-4"/> GitHub</a></li>}
                        </ul>
                    </Section>
                 )}
                {user.skills && user.skills.length > 0 && (
                    <Section icon={Star} title="Skills">
                        <div className="flex flex-wrap gap-4">
                            {(user.skills as any[]).map((skill, idx) => (
                                <div key={idx}>
                                    <p className="font-semibold">{skill.name || skill}</p>
                                    <p className="text-xs text-muted-foreground">{skill.proficiency}</p>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}
                 {user.languages && user.languages.length > 0 && (
                    <Section icon={Languages} title="Languages">
                         <div className="space-y-2">
                            {user.languages.map((lang, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <p>{lang.name}</p>
                                    <p className="text-muted-foreground">{lang.proficiency}</p>
                                </div>
                            ))}
                        </div>
                    </Section>
                 )}
                 {user.awards && user.awards.length > 0 && (
                    <Section icon={AwardIcon} title="Awards & Recognition">
                        <div className="space-y-4">
                            {user.awards.map((award, idx) => (
                               <div key={idx}>
                                    <h4 className="font-semibold">{award.name} ({award.year})</h4>
                                    <p className="text-sm text-muted-foreground">{award.awardingBody}</p>
                               </div>
                            ))}
                        </div>
                    </Section>
                 )}

                 {user.associations && user.associations.length > 0 && (
                    <Section icon={UserCheck} title="Professional Associations">
                        <div className="space-y-3">
                            {user.associations.map((assoc, idx) => (
                               <div key={idx}>
                                    <h4 className="font-semibold">{assoc.name}</h4>
                                    <p className="text-sm text-muted-foreground">{assoc.role} (since {assoc.year})</p>
                               </div>
                            ))}
                        </div>
                    </Section>
                 )}
            </div>
        </div>
    );
}
