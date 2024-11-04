import { useState, useEffect, useRef } from 'react';
import StarRating from './StarRating';
import { useKey } from './useKey';
import { useMovies } from './useMovies';
import { useLocalStorageState } from './useLocalStorageState';

const average = (arr) =>
  arr.reduce((acc, cur, _, arr) => acc + cur / arr.length, 0);

const KEY = '11d3dc04';

/* keeping the states in the beginning of the components then the event handler functions which update some of the state and in the end the effects */

export default function App() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const { movies, isLoading, error } = useMovies(query, handleCloseMovie);
  const [watched, setWatched] = useLocalStorageState([], 'watched');

  // useState(localStorage.getItem('watched')) // calling a function not passing a function

  /* fetch(`http://www.omdbapi.com/?apikey=${KEY}&s=interstellar`)
    .then((res) => res.json())
    .then((data) => setMovies(data.Search));
 
  setWatched([]); */

  function handleSelectedMovie(id) {
    setSelectedId((selectedId) => (id === selectedId ? null : id));
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);

    // localStorage.setItem('watched', watched) // why not like this (hints: asynchronous, stale state)
    // localStorage.setItem('watched', JSON.stringify([...watched, movie]));
  }

  function handleDeleteWatched(id) {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  }

  return (
    <>
      <NavBar>
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>

      <Main>
        <Box>
          {/* {isLoading ? <Loader /> : <MovieList movies={movies} />} */}
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MovieList movies={movies} onSelectMovie={handleSelectedMovie} />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              onCloseMovie={handleCloseMovie}
              onAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMoviesList
                watched={watched}
                onDeleteWatched={handleDeleteWatched}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function Loader() {
  return <p className='loader'>Loading</p>;
}

function ErrorMessage({ message }) {
  return <p className='error'>{message}</p>;
}

function NavBar({ children }) {
  return (
    <nav className='nav-bar'>
      <Logo />
      {children}
    </nav>
  );
}

function Logo() {
  return (
    <div className='logo'>
      <span role='img'>🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null);

  useKey('Enter', function () {
    if (document.activeElement === inputEl.current) return;
    inputEl.current.focus();
    setQuery('');
  });

  /* useEffect(
    function () {
      const el = document.querySelector('.search');
      el.focus();
    },
    []
    // [query]
  ); */

  return (
    <input
      className='search'
      type='text'
      placeholder='Search movies...'
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />
  );
}

function NumResults({ movies }) {
  return (
    <p className='num-results'>
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className='main'>{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className='box'>
      <button className='btn-toggle' onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? '–' : '+'}
      </button>

      {isOpen && children}
    </div>
  );
}

function MovieList({ movies, onSelectMovie }) {
  return (
    <ul className='list list-movies'>
      {movies?.map((movie) => (
        <Movie movie={movie} key={movie.imdbID} onSelectMovie={onSelectMovie} />
      ))}
    </ul>
  );
}

function Movie({ movie, onSelectMovie }) {
  return (
    <li onClick={() => onSelectMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function MovieDetails({ selectedId, onCloseMovie, onAddWatched, watched }) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState('');

  const countRef = useRef(0);

  useEffect(
    function () {
      if (userRating) countRef.current = countRef.current + 1;
    },
    [userRating]
  );

  const isWatched = watched.map((movie) => movie.imdbID).includes(selectedId);
  const watchedUserRating = watched.find(
    (movie) => movie.imdbID === selectedId
  )?.userRating;

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  /* to run the lines below first disable eslint */
  /* if (imdbRating > 8) [isTop, setIsTop] = useState(false);
  if (imdbRating > 8) return <p>Greatest ever!</p>; */

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(' ').at(0)),
      userRating,
      countRatingDecisions: countRef.current,
    };

    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }

  useKey('Escape', onCloseMovie);

  useEffect(
    function () {
      async function getMovieDetails() {
        setIsLoading(true);

        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
        );
        const data = await res.json();

        setMovie(data);
        setIsLoading(false);
      }
      getMovieDetails();
    },
    [selectedId]
  );

  // console.log(title); // returns undefined until data from API arrives
  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie | ${title}`;

      return function () {
        document.title = 'usePopcorn';
      };
    },
    [title]
  );

  return (
    <div className='details'>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className='btn-back' onClick={onCloseMovie}>
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${movie} movie`} />
            <div className='details-overview'>
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐</span>
                {imdbRating} IMDB Rating
              </p>
            </div>
          </header>

          <section>
            <div className='rating'>
              {!isWatched ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setUserRating}
                  />

                  {userRating > 0 && (
                    <button className='btn-add' onClick={handleAdd}>
                      + Add to list
                    </button>
                  )}
                </>
              ) : (
                <p>
                  You rated this movie {watchedUserRating} <span>⭐</span>
                </p>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </div>
  );
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <div className='summary'>
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMoviesList({ watched, onDeleteWatched }) {
  return (
    <ul className='list'>
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          onDeleteWatched={onDeleteWatched}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, onDeleteWatched }) {
  return (
    <li>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>

        <button
          className='btn-delete'
          onClick={() => onDeleteWatched(movie.imdbID)}
        >
          X
        </button>
      </div>
    </li>
  );
}

/* it is important that we do not call the component inside of itself as it creates an infinite loop of the component calling itself and the component won't be able to render itself because of the infinite loop */

/* both App, Navbar, and Main are structural components as they are only responsible for the structure or layout of the application */

/* prop drilling means that we need to pass some prop through several nested child components in order to get that data into some deeply nested component */

/* the code at the top level of the function is the code that will run as the component first mounts adn therefore it is called render logic and in it we should have no side effects */

/* as we have learned that we should never update state in render logic but above we are gonna break that rule to see why it exists in the first place so we are gonna fetch movie data in the App component because it will be rendered as soon as the application runs */

/* as we do data fetching right inside the render logic we introduce a side effect into the component's render logic as now it is clearly interacting with the outside world which should never be allowed in render logic and as we set the list of movies that we get from the API into our movie state then in our network tab we see that our fetch is running infinite number of requests without stopping so every second our app is firing off multiple fetch requests to the API which is really bad and the reason is that setting the state in the render logic will immediately cause the component to re-render itself again because that is just how state works so we see as the component is re-rendered the component function is executed again which then will fire the fetch request again which in turn will set the movies again as well and then this whole thing starts over and over again */

/* in simpler words as the state is set the component is re-rendered again which then will fetch again which will set the movies again causing an infinite loop of state setting and then the component re-rendering and this is the reason why it is not allowed to set state in render logic */

/* it happens even if we try to set state in the top level code so not inside a handler and we get react complaining and generating error in the console stating too many renders meaning that we again entered into infinite loop stage where updating state will cause the component to re-render which will cause the state to be set and so on into infinity */

/* the reason we define the KEY variable outside the component function as each time the component gets re-rendered the entire component function will be executed again meaning all the render logic and if the variable is part of the render logic it will also be recreated each time the component renders */

/* but we do want to set the state so that it can display the results that we get from the API and the solution to that is the tool in our react toolbox which is the useEffect hook */

/* the idea of the useEffect hook us to give us a place where we can safely write side effects but side effects registered with useEffect hook will only be executed after certain renders meaning only after the initial render and the useEffect doesn't return anything so we don't store the result into any variable but instead we pass in a function which is called effect containing the code that we want to run as a side effect basically code that we want to regsiter as a side effect to be executed at a certain point in time and we also pass in a second argument called dependency array which means that the effect specified will only run on mount meaning it will only run when the app component renders for the very first time */

/* this is how we solve the problem that we encountered and now our effect only runs when the component mounts and this is the very bare bones way in which we do data fetching in simple react apps as soon as the application loads and in larger apps we use external libraries for data fetching */

/* once again we use the useEffect hook to register an effect which is the function (the first argument) containing the side effect that we want to register and basically register means that we want the code not to run as the component renders but actually after it has been painted onto the screen so before the code was executed while the component was rendering meaning when the function was being executed and now it will be executed after the render then as a second argument we passed in a empty array which means that the effect will only be executed as the component first mounts */

/* now we are gonna convert the effect into an async function instead of basic promise handling but we can't to do it directly because then we get a warning that tells us that effect callbacks are synchronous to prevent race conditions meaning the effect function that we place into the useEffect can't return a promise which is what an async function does so instead of doing it directly we create a new function inside the useEffect effect function (first argument that accepts a function) */

/* above when we console log the movies it returns an empty array and the reason for that as we previously learned is that setting state is asynchronous meaning as we instruct the react to set the state just one line above that it doesn't mean it will happen immediately so it will happen after the function is called again and when we log it to console we have stale state meaning we still have the old value of the state (how it was before meaning it was empty our initial state) */

/* and the reason we get two outputs or we see two requests happening is that react v18 in strict mode runs our effect not only once but twice but only in development and when our application is in production this will no longer happen and all this happens so that react can identify if there are any problems with our effects */

/* whenever we are doing any data fetching in any web application and dealing with asynchronous data we always need to assume that something can go wrong therefore we have to account for such situations by handling those errors */

/* the reason we only store the the id and not the entire movie object itself because the movies that we get from search have very limited information while on the right side we want all kinds of details about the movie when we select it on the left side so there will be another API call based on the id which then will be displayed on the right side and we also create a new component for that which will be displayed if there is a selected id */

/* changing the page title in the browser which is outside of the application is a side effect because we are clearly interacting with the outside world meaning react application so we are gonna register a side effect using the useEffect hook and we going to register the side effect in the movie details component because we want the title to change when we select a movie and that movie then is loaded and actually displayed or when the component is mounted */

/* now we are gonna implement a small feature which will require us to listen globally to a keypress event meaning when we open up the movie details component instead of clicking the button to go back we can go back by pressing the escape key (small feature) so for that we need to globally listen to that keypress event */

/* the way in which we can react to a keypress event in the entire app is basically by simply attaching an event listener to the entire document so we are gonna do that in the app component and this is a side effect because we will be directly touching the DOM we will need a effect and we use addEventListener which is simply a DOM function so we are doing DOM manipulation meaning we are stepping outside of react now which is the reason why the react team also calls the useEffect hook an escape hatch meaning a way of escaping having to write all the code using the react way */

/* in the movieDetails component we break the rule of hooks and in the component tree (console) we can see that hooks are numbered and each of the hook is identified by react by their order number and now if we call a hook outside of the top level meaning calling it conditionally that would mess up the entire numbered order causing problems as we see above when we select a movie with the rating above 8 and react immediately tells us that is has detected a change in the order of hooks called in this component showing both the previous and next render changes and one more subtle thing that can happen is an early return like above then only fewer hooks are rendered that are placed before the return which again causes problems because like this we can't guarantee that all the hooks are always called in the same order */

/* now we are gonna build a new feature which is to persist the watchlist data in local storage and we do that in two parts first each time that the watchlist state is updated we will update the local storage then in the second part each time that the application loads meaning when the app component first mounts we will read that data from local storage and store it into the watchlist state and we can implement this feature in two different ways or places so the first option is to store that data into local storage each time that a new movie is actually added or we can do it in an effect and we will do it in an effect instead of a handler function because later we will make the storing data into local storage reusable */

/* local storage is a very simple key value pair storage that is available in the browser and where we can store some data for each domain meaning the stored data will only be available through the exact URL it is saved on not for other ones and we also need to convert the data we are storing into a string because in local storage we can only store key value pairs where the value is a string so for that we use a built-in method */

/* when we think of the second part where we need to read the data back into the application as soon as the app component mounts which owns the watched state we might think that we should use another effect in order to get the data back from the local storage on the initial render and then store that data in the wathced state however there is a better way which is to instead of passing in a value (empty array) is to pass in a callback function because teh useState hook also accepts a callback function instead of just a single value we can then initialize the state with whatever value this callback function will return and react only calls this function on the initial render and is simply ignored on subsequent re-renders just like the single values and this function needs to be a pure function and it can't receive any arguments */

/* whenever the initial value of the useState hook depends on some sort of computation we should always pass in a callback function and we should never call a function inside useState as we did above because even though react would ignore the value but still call the function on every render */

/* when we delete a movie from the list and we can check from the local storage that it automatically gets removed from there and the reason for that is our effect that we have effectively synchronized the watched state with our local storage meaning when the wathced state changes our local storage changes as well which is a great advantage of having used the useEffect hook instead of setting the local storage in the function handler because if we had done it ther then we would also have to manually set the local storage again as we deleted a movie in the handleDeleteWatched */

/* we do an experiment to understand why we should not select DOM elements like this for that we automatically give the search component's input element focus each time the application mounts and for that we use an effect however as we have learned react is all about being declarative so manually selecting DOM elements like we have above is not really the react way of doing things as in react we don't add event listeners also adding classes or ids manually and if we were to put a condition in dependency array that this code should re-run each time the query changes that would mean we would select the element (search) over and over again which is also not ideal and to solve all these problems to make the action of selecting elements more declarative such as everything else in react we need the concepts of refs and now we are gonna do the same thing but with refs */

/*  */
