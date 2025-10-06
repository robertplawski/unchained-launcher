import { useCallback, useState, type ReactElement } from "react";
import CategoryButton from "./CategoryButton";
import { useNavigate } from "react-router";

type Category = {
  name: string,
  count?: number,
  label: string,
  content?: ReactElement,
}

export default function CategoryList({ categories, className }: { categories: Category[], className?: string }) {
  const navigate = useNavigate();

  const initialIndex = (() => {
    const hash = window.location.hash.replace("#", "");
    const idx = categories.findIndex(c => c.name.toString() === hash);
    return idx >= 0 ? idx : 0;
  })();

  const [selectedCategory, setSelectedCategory] = useState<number>(initialIndex);

  const handleCategorySelect = useCallback((category: Category) => {
    const idx = categories.indexOf(category);
    setSelectedCategory(idx);
    navigate(`#${category.name.toString()}`);
  }, [categories, navigate]);

  return (
    <div className={`sticky -translate-y-2 top-0 z-10 py-4 flex flex-row flex-wrap justify-center items-center gap-2  ${className || ''}`}>
      {
        categories.map((category, idx) => (
          <CategoryButton
            key={idx}
            name={category.label}
            count={category.count}
            selected={selectedCategory === idx}
            onClick={() => handleCategorySelect(category)}
          />
        ))
      }
    </div >
  );
}

