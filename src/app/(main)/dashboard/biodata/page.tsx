"use client";

import React, { useEffect, useState, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config"; // Import auth here
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"; // Import onAuthStateChanged and User type
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

// Importing jsPDF for PDF generation
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface UserProfile {
  displayName: string;
  dob: string; // Date of Birth
  placeOfBirth: string;
  rashi: string;
  nakshatra: string;
  complexion: string;
  height: string;
  education: string[];
  occupation: string;
  fatherName: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  brotherNameYounger: string;
  brotherOccupationYounger: string;
  sisterNameYounger: string;
  sisterOccupationYounger: string;
  contactNumberFather: string;
  contactNumberMother: string;
  address: string;
  profilePictureUrl: string;
}

export default function BiodataPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null); // Use local state for currentUser
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const biodataRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid); // Use user.uid here
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfile({
              ...(userData as UserProfile),
              profilePictureUrl: userData.photoURL || user.photoURL || "/path/to/default-avatar.png", // Map photoURL to profilePictureUrl with fallback
            });
          } else {
            toast({
              title: "Profile not found",
              description: "Could not load user profile data.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          toast({
            title: "Error",
            description: "Failed to fetch profile data.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe(); // Cleanup subscription
  }, []); // Empty dependency array to run once on mount

  const generatePdf = async () => {
    if (!biodataRef.current) return;

    setIsLoading(true); // Indicate that PDF generation is in progress
    try {
      const canvas = await html2canvas(biodataRef.current, { scale: 2 }); // Scale up for better quality
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4"); // Portrait, millimeters, A4 size
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save("Biodata-" + (profile?.displayName || "User") + ".pdf");
      toast({
        title: "PDF Generated",
        description: "Your biodata has been downloaded.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading biodata...</div>;
  }

  if (!profile) {
    return (
      <div className="p-4 text-center">
        No profile data found. Please complete your profile.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div ref={biodataRef} className="relative p-6 font-serif">
          {/* Decorative Borders (Approximation) */}
          <div className="absolute inset-0 border-[10px] border-[#9e0000] rounded-lg"></div>
          <div className="absolute inset-x-0 top-0 h-[10px] bg-[#9e0000]"></div>
          <div className="absolute inset-x-0 bottom-0 h-[10px] bg-[#9e0000]"></div>
          <div className="absolute inset-y-0 left-0 w-[10px] bg-[#9e0000]"></div>
          <div className="absolute inset-y-0 right-0 w-[10px] bg-[#9e0000]"></div>

          {/* Top Ganesh and Biodata Title */}
          <div className="text-center mb-6 pt-4 relative z-10">
            <p className="text-sm text-gray-600 mb-2">|| Shree Ganesh ||</p>
            <div className="flex justify-center items-center gap-2 mb-4">
              {/* Placeholder for Ganesh image/icon */}
              <img src="/path/to/ganesh_icon.png" alt="Ganesh" className="h-8" /> 
              <h1 className="text-3xl font-bold text-gray-800 tracking-wide">
                BIODATA
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Left Section - Details */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-[#9e0000] mb-4 border-b-2 border-[#9e0000] pb-2">
                PERSONAL DETAILS
              </h2>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-1/3 text-gray-700">Name</span>
                  <span className="w-2/3 flex items-center">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.displayName || "N/A"}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 text-gray-700">Date of Birth</span>
                  <span className="w-2/3 flex items-center">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.dob || "N/A"}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 text-gray-700">Place of Birth</span>
                  <span className="w-2/3 flex items-center">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.placeOfBirth || "N/A"}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 text-gray-700">Rashi</span>
                  <span className="w-2/3 flex items-center">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.rashi || "N/A"}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 text-gray-700">Nakshatra</span>
                  <span className="w-2/3 flex items-center">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.nakshatra || "N/A"}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 text-gray-700">Complexion</span>
                  <span className="w-2/3 flex items-center">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.complexion || "N/A"}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 text-gray-700">Height</span>
                  <span className="w-2/3 flex items-center">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.height || "N/A"}
                    </span>
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="w-1/3 text-gray-700">Education</span>
                  <span className="w-2/3 flex">
                    <span className="mr-2">:</span>
                    <div className="font-medium text-gray-900">
                      {profile.education && profile.education.length > 0 ? (
                        profile.education.map((edu, index) => (
                          <div key={index}>- {edu}</div>
                        ))
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 text-gray-700">Occupation</span>
                  <span className="w-2/3 flex items-center">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.occupation || "N/A"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Family Details */}
              <h2 className="text-xl font-semibold text-[#9e0000] mt-8 mb-4 border-b-2 border-[#9e0000] pb-2">
                FAMILY DETAILS
              </h2>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-1/3 text-gray-700">Father Name</span>
                  <span className="w-2/3 flex items-center">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.fatherName || "N/A"}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 text-gray-700">
                    Father's Occupation
                  </span>
                  <span className="w-2/3 flex items-center">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.fatherOccupation || "N/A"}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 text-gray-700">Mother Name</span>
                  <span className="w-2/3 flex items-center">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.motherName || "N/A"}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 text-gray-700">
                    Mother's Occupation
                  </span>
                  <span className="w-2/3 flex items-center">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.motherOccupation || "N/A"}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 text-gray-700">
                    Brother Name (Younger)
                  </span>
                  <span className="w-2/3 flex items-center">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.brotherNameYounger || "N/A"}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 text-gray-700">
                    Brother's Occupation (Younger)
                  </span>
                  <span className="w-2/3 flex items-center">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.brotherOccupationYounger || "N/A"}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 text-gray-700">
                    Sister Name (Younger)
                  </span>
                  <span className="w-2/3 flex items-center">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.sisterNameYounger || "N/A"}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 text-gray-700">
                    Sister's Occupation (Younger)
                  </span>
                  <span className="w-2/3 flex items-center">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.sisterOccupationYounger || "N/A"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Contact Details */}
              <h2 className="text-xl font-semibold text-[#9e0000] mt-8 mb-4 border-b-2 border-[#9e0000] pb-2">
                CONTACT DETAILS
              </h2>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-1/3 text-gray-700">Contact Number</span>
                  <span className="w-2/3 flex">
                    <span className="mr-2">:</span>
                    <div className="font-medium text-gray-900">
                      <div>Father: {profile.contactNumberFather || "N/A"}</div>
                      <div>Mother: {profile.contactNumberMother || "N/A"}</div>
                    </div>
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="w-1/3 text-gray-700">Address</span>
                  <span className="w-2/3 flex">
                    <span className="mr-2">:</span>
                    <span className="font-medium text-gray-900">
                      {profile.address || "N/A"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Section - Profile Picture */}
            <div className="md:col-span-1 flex justify-center items-start pt-20">
              <div className="border-4 border-amber-600 p-1 bg-white shadow-md">
                <Avatar className="w-48 h-48">
                  <AvatarImage src={profile.profilePictureUrl} alt={profile.displayName} />
                  <AvatarFallback className="text-6xl font-bold">
                    {profile.displayName ? profile.displayName[0] : "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 text-center">
          <Button onClick={generatePdf} disabled={isLoading}>
            {isLoading ? "Generating PDF..." : "Download Biodata as PDF"}
          </Button>
          <p className="mt-2 text-sm text-gray-500">
            www.CreateMyBiodata.com (Placeholder)
          </p>
        </div>
      </div>
    </div>
  );
} 