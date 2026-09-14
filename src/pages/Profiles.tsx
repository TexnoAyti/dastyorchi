import { useState, useEffect } from "react";
import { Plus, User, MapPin, CreditCard, Phone, Trash2, Edit2, Loader2 } from "lucide-react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";
import { PersonProfile } from "../types";

export function Profiles() {
  const [profiles, setProfiles] = useState<PersonProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PersonProfile | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    passport: "",
    phone: ""
  });

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(db, "profiles"),
      where("userId", "==", uid)
    );

    console.log("[Firestore] listener attached: Profiles");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PersonProfile[];
      setProfiles(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "profiles");
      setLoading(false);
    });

    return () => {
      unsubscribe();
      console.log("[Firestore] listener detached: Profiles");
    };
  }, [auth.currentUser?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      const cleanData = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v === undefined ? "" : v])
      );

      if (editingProfile) {
        await updateDoc(doc(db, "profiles", editingProfile.id), {
          ...cleanData
        });
      } else {
        await addDoc(collection(db, "profiles"), {
          userId: auth.currentUser.uid,
          ...cleanData,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingProfile(null);
      setFormData({ fullName: "", address: "", passport: "", phone: "" });
    } catch (error) {
      handleFirestoreError(error, editingProfile ? OperationType.UPDATE : OperationType.CREATE, "profiles");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Profilni o'chirishni xohlaysizmi?")) {
      try {
        await deleteDoc(doc(db, "profiles", id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `profiles/${id}`);
      }
    }
  };

  const openEditModal = (profile: PersonProfile) => {
    setEditingProfile(profile);
    setFormData({
      fullName: profile.fullName,
      address: profile.address || "",
      passport: profile.passport || "",
      phone: profile.phone || ""
    });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">Shaxslar profillari</h1>
          <p className="mt-2 text-gray-600 dark:text-zinc-400">Hujjatlarda foydalanish uchun shaxslar ma'lumotlarini saqlang.</p>
        </div>
        <button
          onClick={() => {
            setEditingProfile(null);
            setFormData({ fullName: "", address: "", passport: "", phone: "" });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl shadow-lg-fallback"
        >
          <Plus className="mr-2 w-5 h-5" />
          Yangi profil qo'shish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <div key={profile.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-lg">{profile.fullName}</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditModal(profile)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-zinc-800">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(profile.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-zinc-800">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600 dark:text-zinc-300">
              {profile.passport && (
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                  <span>{profile.passport}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 dark:text-zinc-500 mt-0.5" />
                  <span className="line-clamp-2">{profile.address}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900/40 rounded-3xl border-2 border-dashed border-gray-200 dark:border-zinc-800">
          <User className="w-16 h-16 text-gray-300 dark:text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-200">Profillar yo'q</h3>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">Hujjatlarni tezroq to'ldirish uchun shaxslar ma'lumotlarini qo'shing.</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 modal-overlay-fallback">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-xl border dark:border-zinc-800 shadow-xl-fallback">
            <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-6 font-sans">
              {editingProfile ? "Profilni tahrirlash" : "Yangi profil qo'shish"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">F.I.Sh. *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Masalan: Eshmatov Toshmat"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Pasport / JShShIR</label>
                <input
                  type="text"
                  value={formData.passport}
                  onChange={(e) => setFormData({...formData, passport: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="AA1234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Telefon raqam</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="+998 90 123 45 67"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Manzil</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none animate-none"
                  rows={3}
                  placeholder="Toshkent shahar, Yunusobod tumani..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
