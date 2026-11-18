import type React from 'react';
import {useMemo, useRef, useState} from 'react';
import {CheckCircle2, ImagePlus, MessageSquarePlus, Trash2, X} from 'lucide-react';
import {
  MAX_REVIEW_IMAGES,
  type Product,
  type ProductReview,
} from '../shared/types';
import {ResilientImage} from './ResilientImage';
import {StarRatingDisplay, StarRatingInput} from './StarRating';

interface ReviewsViewProps {
  products: Product[];
  reviews: ProductReview[];
  initialProductFilter?: string;
  onReviewSubmitted: (reviews: ProductReview[]) => void;
}

export function ReviewsView({
  products,
  reviews,
  initialProductFilter = 'all',
  onReviewSubmitted,
}: ReviewsViewProps) {
  const [filterProductId, setFilterProductId] = useState<string>(initialProductFilter);
  const [filterMinStars, setFilterMinStars] = useState<number>(0);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // New Review Form State
  const [productId, setProductId] = useState<string>(
    initialProductFilter !== 'all'
      ? initialProductFilter
      : products[0]?.id || '',
  );
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg =
      total > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
        : 0;
    const photoReviews = reviews.filter((r) => r.images.length > 0).length;
    return {total, avg, photoReviews};
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (filterProductId !== 'all' && r.productId !== filterProductId) {
        return false;
      }
      if (filterMinStars > 0 && r.rating < filterMinStars) {
        return false;
      }
      return true;
    });
  }, [reviews, filterProductId, filterMinStars]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const remainingSlots = MAX_REVIEW_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setErrorMsg(`Maximum of ${MAX_REVIEW_IMAGES} images allowed per review.`);
      return;
    }

    const acceptedFiles = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setErrorMsg(
        `Only ${remainingSlots} more image slot(s) remaining (limit ${MAX_REVIEW_IMAGES} images).`,
      );
    }

    const newUrls: string[] = [];
    for (const file of acceptedFiles) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Only PNG, JPG, or WebP images are supported.');
        continue;
      }
      if (file.size > 4 * 1024 * 1024) {
        setErrorMsg('Each review photo must be under 4MB.');
        continue;
      }
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsDataURL(file);
      });
      if (dataUrl) newUrls.push(dataUrl);
    }

    if (newUrls.length > 0) {
      setImages((prev) => [...prev, ...newUrls].slice(0, MAX_REVIEW_IMAGES));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!productId || !authorName.trim() || !comment.trim()) {
      setErrorMsg('Please select a T-shirt, enter your name, and write a comment.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          productId,
          authorName,
          rating,
          title,
          comment,
          images,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not publish review.');
        return;
      }
      onReviewSubmitted(data.reviews);
      setAuthorName('');
      setTitle('');
      setComment('');
      setRating(5);
      setImages([]);
      setSuccessMsg('Thank you — your review is now live.');
    } catch {
      setErrorMsg('Network error while publishing review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      {/* Header & Summary */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-zinc-200">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
            Verified Studio Impressions &amp; Print Photos
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            Customer Reviews
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div>
            <p className="text-zinc-500 mb-1">Studio Average</p>
            <div className="flex items-center gap-2">
              <StarRatingDisplay rating={stats.avg} size="md" showNumeric={false} />
              <span className="font-mono tabular-nums text-base font-bold text-zinc-950">
                {stats.avg.toFixed(1)} / 5.0
              </span>
            </div>
          </div>
          <div className="h-8 w-px bg-zinc-200 hidden sm:block" />
          <div>
            <p className="text-zinc-500 mb-1">Total Reviews</p>
            <p className="font-mono tabular-nums text-base font-bold text-zinc-950">
              {stats.total}
            </p>
          </div>
          <div className="h-8 w-px bg-zinc-200 hidden sm:block" />
          <div>
            <p className="text-zinc-500 mb-1">With Customer Photos</p>
            <p className="font-mono tabular-nums text-base font-bold text-zinc-950">
              {stats.photoReviews}
            </p>
          </div>
        </div>
      </div>

      {/* Main 12-Col Layout: Write Review Left (5 cols) + Review Feed Right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-start">
        {/* Left: Write a Review Form */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2 pb-4 border-b border-zinc-200">
            <MessageSquarePlus className="w-4 h-4 text-zinc-900" />
            <h2 className="font-display text-lg font-bold text-zinc-950">
              Leave a Product Review
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                T-Shirt Product
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-semibold text-zinc-900 mb-1.5">
                Your Star Rating
              </span>
              <StarRatingInput value={rating} onChange={setRating} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Jordan Rivera"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                Review Headline
              </label>
              <input
                type="text"
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Crisp print & heavyweight collar"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                Comment
              </label>
              <textarea
                required
                rows={4}
                maxLength={1200}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share fit feedback, cotton weight feel, and print durability..."
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950 resize-y"
              />
            </div>

            {/* Limited Image Uploader (Max 3 Images) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-zinc-900">
                  Add Photos (Optional)
                </span>
                <span className="font-mono tabular-nums text-zinc-500">
                  {images.length} / {MAX_REVIEW_IMAGES} max
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-2.5">
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded-lg border border-zinc-200 overflow-hidden bg-zinc-100"
                  >
                    <img
                      src={imgUrl}
                      alt={`Review upload ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Remove photo ${idx + 1}`}
                      onClick={() =>
                        setImages((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-zinc-950/80 text-white inline-flex items-center justify-center hover:bg-zinc-950 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {images.length < MAX_REVIEW_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-zinc-300 hover:border-zinc-500 bg-zinc-50 flex flex-col items-center justify-center gap-1 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                  >
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-[11px] font-medium">Add Photo</span>
                  </button>
                )}
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}
            {successMsg && (
              <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {successMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {submitting ? 'Publishing Review...' : 'Publish Review'}
            </button>
          </form>
        </div>

        {/* Right: Filter & Review Feed */}
        <div className="lg:col-span-7 space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-zinc-200 rounded-xl p-4">
            <label className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-zinc-700">Product:</span>
              <select
                value={filterProductId}
                onChange={(e) => setFilterProductId(e.target.value)}
                className="px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-900 focus:outline-none cursor-pointer"
              >
                <option value="all">All T-Shirts ({reviews.length})</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg border border-zinc-200">
              {[
                {label: 'All Stars', val: 0},
                {label: '5 Stars', val: 5},
                {label: '4+ Stars', val: 4},
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setFilterMinStars(opt.val)}
                  className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                    filterMinStars === opt.val
                      ? 'bg-white text-zinc-950 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Review Cards */}
          {filteredReviews.length === 0 ? (
            <div className="py-16 text-center bg-white border border-dashed border-zinc-300 rounded-2xl">
              <p className="text-sm font-semibold text-zinc-900">
                No reviews match this filter yet.
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Be the first to share your fit and print photos on the left.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <article
                  key={review.id}
                  className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StarRatingDisplay rating={review.rating} showNumeric={false} />
                    <span className="font-mono tabular-nums text-xs text-zinc-500">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-base font-bold text-zinc-950">
                      {review.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mt-1">
                      <span className="font-medium text-zinc-800">{review.authorName}</span>
                      {review.verifiedPurchase && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified Customer</span>
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{review.productName}</span>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-700 leading-relaxed">
                    {review.comment}
                  </p>

                  {review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 pt-2">
                      {review.images.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setZoomImageUrl(imgUrl)}
                          className="w-20 h-20 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 hover:border-zinc-500 transition-colors cursor-pointer"
                        >
                          <ResilientImage
                            src={imgUrl}
                            alt={`Customer photo ${idx + 1} for ${review.productName}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Image Lightbox */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/85 flex items-center justify-center p-4"
          onClick={() => setZoomImageUrl(null)}
        >
          <button
            type="button"
            onClick={() => setZoomImageUrl(null)}
            aria-label="Close review photo"
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white text-zinc-950 inline-flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={zoomImageUrl}
            alt="Customer review photo enlarged"
            className="max-w-full max-h-[86vh] rounded-xl object-contain"
          />
        </div>
      )}
    </section>
  );
}
