import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CompletedCourse {
  id: string; // e.g., "CMPT 120"
  term: string; // e.g., "Fall 2023"
  credits: number;
  grade?: string;
}

export interface WishlistCourse {
  id: string; // e.g., "MACM 101"
  credits?: number;
  termPlanned?: string;
}

interface CatalogState {
  completedCourses: CompletedCourse[];
  wishlistCourses: WishlistCourse[];
  addCompletedCourse: (course: CompletedCourse) => void;
  removeCompletedCourse: (id: string, term: string) => void;
  addWishlistCourse: (course: WishlistCourse) => void;
  removeWishlistCourse: (id: string) => void;
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set) => ({
      completedCourses: [],
      wishlistCourses: [],
      addCompletedCourse: (course) =>
        set((state) => ({
          completedCourses: [
            ...state.completedCourses.filter(
              (c) => !(c.id === course.id && c.term === course.term)
            ),
            course,
          ],
        })),
      removeCompletedCourse: (id, term) =>
        set((state) => ({
          completedCourses: state.completedCourses.filter(
            (c) => !(c.id === id && c.term === term)
          ),
        })),
      addWishlistCourse: (course) =>
        set((state) => ({
          wishlistCourses: state.wishlistCourses.some((c) => c.id === course.id)
            ? state.wishlistCourses
            : [...state.wishlistCourses, course],
        })),
      removeWishlistCourse: (id) =>
        set((state) => ({
          wishlistCourses: state.wishlistCourses.filter((c) => c.id !== id),
        })),
    }),
    {
      name: "catalog-storage",
    }
  )
);
