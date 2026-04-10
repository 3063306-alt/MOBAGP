// @ts-nocheck
import React, { useState, useEffect, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { UserProfile } from './types';
import { Loader2 } from 'lucide-react';

// Components
import AdminPanel from './components/AdminPanel';
import AuthPage from './components/AuthPage';
import PublicPage from './components/PublicPage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/admin" /> : <AuthPage />} />
        <Route path="/admin/*" element={user ? <AdminPanel user={user} /> : <Navigate to="/login" />} />
        <Route path="/:slug" element={<PublicPageWrapper />} />
        <Route path="/" element={<Navigate to={user ? "/admin" : "/login"} />} />
      </Routes>
    </Router>
  );
}

function PublicPageWrapper() {
  const { slug } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    
    console.log(`[App] Setting up profile listener for slug: ${slug}`);
    const q = query(collection(db, 'users'), where('slug', '==', slug));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log(`[App] Profile snapshot triggered for slug: ${slug}. Found ${querySnapshot.size} docs.`);
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        const profileId = querySnapshot.docs[0].id;
        console.log(`[App] Using profile: ${profileId} (@${docData.slug})`);
        setProfile({ uid: profileId, ...docData } as UserProfile);
        setError(null);
      } else {
        console.warn(`[App] No profile found for slug: ${slug}`);
        setError("Page not found");
      }
      setLoading(false);
    }, (err) => {
      setError("Error loading page");
      handleFirestoreError(err, OperationType.GET, `users (slug: ${slug})`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <p className="text-gray-600">{error || "Page not found"}</p>
        </div>
      </div>
    );
  }

  return <PublicPage key={profile.uid} profile={profile} />;
}
