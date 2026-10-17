const cyclingImage = 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=2000&q=90';

export default function AnimatedBikeHero() {
  return <div className="bike-hero" role="img" aria-label="A group of cyclists riding together">
    <img className="bike-hero__photo" src={cyclingImage} alt="" />
    <div className="bike-hero__shade" />
  </div>;
}
