import React, { useState, useEffect } from 'react';
import { Search, Film, Star, Calendar, Clock, Award, TrendingUp, Tag } from 'lucide-react';
import InfiniteScroll from 'react-infinite-scroll-component';

const OMDB_API_KEY = '9b30f837';

const MOVIE_CATEGORIES = {
  'Action & Sci-Fi': [
    "Inception", "The Dark Knight", "The Matrix", "Interstellar", "Gladiator",
    "Mad Max: Fury Road", "Avatar", "Blade Runner 2049", "Edge of Tomorrow"
  ],
  'Drama & Crime': [
    "The Shawshank Redemption", "The Godfather", "Pulp Fiction", "Fight Club",
    "Goodfellas", "The Departed", "Forrest Gump", "The Green Mile", "Schindler's List"
  ],
  'Adventure & Fantasy': [
    "The Lord of the Rings", "Pirates of the Caribbean", "Harry Potter", "Star Wars",
    "Jurassic Park", "Indiana Jones", "The Avengers", "Back to the Future"
  ],
  'Thriller & Mystery': [
    "Se7en", "Silence of the Lambs", "Memento", "Gone Girl", "Shutter Island",
    "The Usual Suspects", "The Prestige", "No Country for Old Men"
  ],
  'Animation': [
    "Spirited Away", "The Lion King", "Toy Story", "Up", "WALL-E",
    "How to Train Your Dragon", "Spider-Man: Into the Spider-Verse"
  ]
};

const TRENDING_MOVIES = Object.values(MOVIE_CATEGORIES).flat();

function App() {
  const [search, setSearch] = useState('');
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [trendingPage, setTrendingPage] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const moviesPerPage = 10;

  const searchMovies = async (resetMovies = false) => {
    if (!search && !isSearching) return;
    
    setLoading(true);
    const pageToFetch = resetMovies ? 1 : page;
    
    try {
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${search}&page=${pageToFetch}`
      );
      const data = await response.json();
      
      if (data.Search) {
        if (resetMovies) {
          setMovies(data.Search);
          setPage(2);
        } else {
          setMovies([...movies, ...data.Search]);
          setPage(page + 1);
        }
        setHasMore(data.Search.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
    
    setLoading(false);
  };

  const fetchTrendingMovies = async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      let moviesToFetch = selectedCategories.length > 0
        ? selectedCategories.flatMap(category => MOVIE_CATEGORIES[category])
        : TRENDING_MOVIES;

      const startIndex = reset ? 0 : (trendingPage - 1) * moviesPerPage;
      const endIndex = startIndex + moviesPerPage;
      const currentBatch = moviesToFetch.slice(startIndex, endIndex);
      
      const fetchPromises = currentBatch.map(movieTitle =>
        fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${movieTitle}`)
          .then(res => res.json())
      );

      const results = await Promise.all(fetchPromises);
      const newMovies = results
        .filter(data => data.Response === "True")
        .map(data => ({
          imdbID: data.imdbID,
          Title: data.Title,
          Year: data.Year,
          Poster: data.Poster,
          Type: data.Type
        }));

      if (reset) {
        setMovies(newMovies);
        setTrendingPage(2);
      } else {
        setMovies([...movies, ...newMovies]);
        setTrendingPage(trendingPage + 1);
      }
      
      setHasMore(endIndex < moviesToFetch.length);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
    }
    
    setLoading(false);
  };

  const fetchMovieDetails = async (imdbID) => {
    try {
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbID}&plot=full`
      );
      const data = await response.json();
      setSelectedMovie(data);
    } catch (error) {
      console.error('Error fetching movie details:', error);
    }
  };

  const loadMore = () => {
    if (isSearching) {
      searchMovies(false);
    } else {
      fetchTrendingMovies(false);
    }
  };

  const toggleCategory = (category) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category];
      return newCategories;
    });
  };

  useEffect(() => {
    if (!search && !isSearching) {
      fetchTrendingMovies(true);
    }
  }, []);

  useEffect(() => {
    if (!isSearching && selectedCategories.length >= 0) {
      fetchTrendingMovies(true);
    }
  }, [selectedCategories]);

  useEffect(() => {
    if (search) {
      setIsSearching(true);
      const delayDebounceFn = setTimeout(() => {
        searchMovies(true);
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setIsSearching(false);
      fetchTrendingMovies(true);
    }
  }, [search]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Film className="w-8 h-8 text-indigo-500" />
              <h1 className="text-xl sm:text-2xl font-bold">MovieSearch</h1>
            </div>
            <div className="flex-grow max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for movies..."
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-10"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!isSearching && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Tag className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-semibold">Categories</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(MOVIE_CATEGORIES).map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    selectedCategories.includes(category)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isSearching && (
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-semibold">
              {selectedCategories.length > 0 ? 'Suggested Movies' : 'Trending Movies'}
            </h2>
          </div>
        )}

        <InfiniteScroll
          dataLength={movies.length}
          next={loadMore}
          hasMore={hasMore}
          loader={
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          }
          endMessage={
            <div className="text-center py-4 text-gray-400">
              {movies.length > 0 && "That's all folks! 🎬"}
            </div>
          }
        >
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {movies.map((movie) => (
              <div
                key={movie.imdbID}
                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer transform hover:scale-105 transition-transform"
                onClick={() => fetchMovieDetails(movie.imdbID)}
              >
                <div className="relative pb-[150%]">
                  <img
                    src={movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster'}
                    alt={movie.Title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-2 sm:p-4">
                  <h3 className="text-sm sm:text-base font-semibold truncate">{movie.Title}</h3>
                  <div className="flex items-center space-x-2 text-gray-400 mt-1 sm:mt-2">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">{movie.Year}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </InfiniteScroll>
      </main>

      {selectedMovie && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-xl sm:text-2xl font-bold pr-8">{selectedMovie.Title}</h2>
                <button
                  onClick={() => setSelectedMovie(null)}
                  className="text-gray-400 hover:text-white p-2"
                  aria-label="Close modal"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
              <div className="mt-4 sm:mt-6 flex flex-col md:grid md:grid-cols-2 gap-4 sm:gap-8">
                <div className="relative">
                  <img
                    src={selectedMovie.Poster !== 'N/A' ? selectedMovie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster'}
                    alt={selectedMovie.Title}
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="text-lg">{selectedMovie.imdbRating}/10</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <span>{selectedMovie.Runtime}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-purple-500" />
                    <span className="text-sm sm:text-base">{selectedMovie.Awards}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Plot</h3>
                    <p className="text-gray-300 text-sm sm:text-base">{selectedMovie.Plot}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Cast</h3>
                    <p className="text-gray-300 text-sm sm:text-base">{selectedMovie.Actors}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Director</h3>
                    <p className="text-gray-300 text-sm sm:text-base">{selectedMovie.Director}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Genre</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMovie.Genre.split(', ').map((genre) => (
                        <span
                          key={genre}
                          className="px-2 sm:px-3 py-1 bg-indigo-600 rounded-full text-xs sm:text-sm"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  export default App;