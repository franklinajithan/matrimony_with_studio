
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchIcon, Filter } from "lucide-react";

export default function SearchPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-semibold text-gray-800">Find Your Match</h1>
        <p className="mt-2 text-lg text-muted-foreground">Use advanced filters to find compatible profiles.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline text-2xl">
            <Filter className="h-6 w-6 text-primary" />
            Search Filters
          </CardTitle>
          <CardDescription>Specify your criteria to narrow down your search.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="age-min">Age Range</Label>
            <div className="flex items-center gap-2">
              <Input id="age-min" type="number" placeholder="Min Age" className="w-1/2" />
              <span className="text-muted-foreground">-</span>
              <Input id="age-max" type="number" placeholder="Max Age" className="w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
             <div className="flex items-center gap-2">
              <Input id="height-min" type="text" placeholder="Min (e.g. 5'0&quot;)" className="w-1/2" />
               <span className="text-muted-foreground">-</span>
              <Input id="height-max" type="text" placeholder="Max (e.g. 6'0&quot;)" className="w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="religion">Religion</Label>
            <Select>
              <SelectTrigger id="religion">
                <SelectValue placeholder="Select Religion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hinduism">Hinduism</SelectItem>
                <SelectItem value="islam">Islam</SelectItem>
                <SelectItem value="christianity">Christianity</SelectItem>
                <SelectItem value="sikhism">Sikhism</SelectItem>
                <SelectItem value="buddhism">Buddhism</SelectItem>
                <SelectItem value="jainism">Jainism</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                 <SelectItem value="any">Any</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="caste">Caste/Community</Label>
            <Input id="caste" placeholder="Enter Caste or Community" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Mother Tongue</Label>
            <Input id="language" placeholder="e.g., Tamil, Sinhala, English" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="City, State, Country" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profession">Profession</Label>
            <Input id="profession" placeholder="Enter Profession" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="nakshatra">Nakshatra (Star)</Label>
            <Input id="nakshatra" placeholder="Enter Nakshatra" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="rasi">Rasi (Zodiac)</Label>
            <Input id="rasi" placeholder="Enter Rasi" />
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex justify-end mt-4">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <SearchIcon className="mr-2 h-5 w-5" /> Search Matches
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-12">
        <h2 className="font-headline text-3xl font-semibold text-gray-700 mb-6 text-center">Search Results</h2>
        {/* Placeholder for search results. Could be a grid of profile cards similar to DiscoverPage */}
        <div className="text-center p-12 border-2 border-dashed border-border rounded-lg">
          <SearchIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Your search results will appear here.</p>
          <p className="text-sm text-muted-foreground">Adjust your filters above to find potential matches.</p>
        </div>
      </div>
    </div>
  );
}
