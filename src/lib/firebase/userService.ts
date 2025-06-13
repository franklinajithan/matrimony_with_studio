import { db } from "@/lib/firebase/config";
import { doc, setDoc, updateDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";

function generateSearchTerms(userData: any): string[] {
  const terms = new Set<string>();
  
  // Add display name terms
  if (userData.displayName) {
    const nameTerms = userData.displayName.toLowerCase().split(/\s+/);
    nameTerms.forEach(term => {
      // Add full terms
      terms.add(term);
      // Add partial terms for better matching, starting from length 1
      for (let i = 1; i <= term.length; i++) {
        terms.add(term.substring(0, i));
      }
    });
  }

  // Add profession terms
  if (userData.profession) {
    const professionTerms = userData.profession.toLowerCase().split(/\s+/);
    professionTerms.forEach(term => {
      // Add full terms
      terms.add(term);
      // Add partial terms for better matching, starting from length 1
      for (let i = 1; i <= term.length; i++) {
        terms.add(term.substring(0, i));
      }
    });
  }

  // Add location terms
  if (userData.location) {
    const locationTerms = userData.location.toLowerCase().split(/[\s,]+/);
    locationTerms.forEach(term => {
      // Add full terms
      terms.add(term);
      // Add partial terms for better matching, starting from length 1
      for (let i = 1; i <= term.length; i++) {
        terms.add(term.substring(0, i));
      }
    });
  }

  // Add bio terms (limited to important words)
  if (userData.bio) {
    const bioWords = userData.bio.toLowerCase().split(/\s+/);
    // Filter out common words and keep only meaningful terms
    const meaningfulWords = bioWords.filter(word => 
      word.length > 2 && // Keep words longer than 2 characters for bio
      !['the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'are', 'was', 'were', 'is'].includes(word)
    );
    meaningfulWords.forEach(term => {
      // Add full terms
      terms.add(term);
      // Add partial terms for better matching, starting from length 1
      for (let i = 1; i <= term.length; i++) {
        terms.add(term.substring(0, i));
      }
    });
  }

  return Array.from(terms);
}

export async function updateUserProfile(userId: string, userData: any) {
  try {
    const userRef = doc(db, "users", userId);
    
    // Generate search terms from user data
    const searchTerms = generateSearchTerms(userData);
    
    // Update user data with search terms
    await updateDoc(userRef, {
      ...userData,
      searchTerms,
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

export async function createUserProfile(userId: string, userData: any) {
  try {
    const userRef = doc(db, "users", userId);
    
    // Generate search terms from user data
    const searchTerms = generateSearchTerms(userData);
    
    // Create user document with search terms
    await setDoc(userRef, {
      ...userData,
      searchTerms,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
}

// Function to update search terms for all existing users
export async function updateAllUsersSearchTerms() {
  try {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    
    const updatePromises = querySnapshot.docs.map(async (doc) => {
      const userData = doc.data();
      const searchTerms = generateSearchTerms(userData);
      
      await updateDoc(doc.ref, {
        searchTerms,
        updatedAt: serverTimestamp()
      });
    });

    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error("Error updating all users' search terms:", error);
    throw error;
  }
} 