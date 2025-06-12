
"use client"; // Required for form handling

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import Image from "next/image";

export default function ContactPage() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    alert("Thank you for your message! We will get back to you soon. (This is a mock submission)");
    (event.target as HTMLFormElement).reset();
  };

  return (
    <div className="space-y-12 py-8">
      <section className="text-center py-12 bg-gradient-to-br from-rose-50 to-peach-100 rounded-xl shadow-lg">
        <h1 className="font-headline text-5xl font-bold text-primary mb-6">
          Get In Touch
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We're here to help! Whether you have a question, feedback, or need support, please don't hesitate to reach out.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-12 items-start">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Send Us a Message</CardTitle>
            <CardDescription>Fill out the form below and we'll respond as soon as possible.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your Name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Regarding..." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Your message..." rows={5} required />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Send className="mr-2 h-4 w-4" /> Send Message
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <div className="p-2 bg-primary/10 rounded-full mr-3">
                    <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Email Us</h3>
                  <a href="mailto:support@matchcraft.com" className="text-muted-foreground hover:text-primary">support@matchcraft.com</a>
                </div>
              </div>
               <div className="flex items-start">
                <div className="p-2 bg-primary/10 rounded-full mr-3">
                    <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Call Us (Mon-Fri, 9am-6pm)</h3>
                  <p className="text-muted-foreground">+91 123 456 7890 (India)</p>
                  <p className="text-muted-foreground">+94 112 345 678 (Sri Lanka)</p>
                </div>
              </div>
              <div className="flex items-start">
                 <div className="p-2 bg-primary/10 rounded-full mr-3">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Our Office (By Appointment Only)</h3>
                  <p className="text-muted-foreground">123 Matrimony Lane, Tech Park, Bangalore, India</p>
                  <p className="text-muted-foreground">456 Love Street, Colombo, Sri Lanka</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="rounded-lg overflow-hidden shadow-lg">
            <Image 
                src="https://placehold.co/600x400.png?text=Map+to+Our+Office" 
                alt="Map placeholder showing office location"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
                data-ai-hint="office map"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
