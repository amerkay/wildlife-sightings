// SPDX-License-Identifier: MIT
// Copyright contributors to the kepler.gl project

/** @jsxImportSource react */
import React from "react";
import type { Dispatch } from "react";
import { connect, Provider } from "react-redux";

import { applyMiddleware, combineReducers, compose, createStore } from "redux";

import KeplerGl from "@kepler.gl/components";
import keplerGlReducer, {
  enhanceReduxMiddleware,
  type KeplerGlState,
} from "@kepler.gl/reducers";

import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";

// create reducers
const reducers = combineReducers({
  // mount keplerGl reducer
  keplerGl: keplerGlReducer.initialState({
    uiState: {
      readOnly: false,
      currentModal: null,
    },
  }),
});

// create middlewares
const middleWares = enhanceReduxMiddleware([
  // Add other middlewares here
]);

// craeteEnhancers
const enhancers = applyMiddleware(...middleWares);

// create store
const initialState = {};
const store = createStore(reducers, initialState, compose(enhancers));

interface AppProps {
  mapboxApiAccessToken: string;
}

const App: React.FC<AppProps> = ({ mapboxApiAccessToken }) => (
  <div
    style={{
      position: "absolute",
      top: "0px",
      left: "0px",
      width: "100%",
      height: "100%",
    }}
  >
    <AutoSizer>
      {({ height, width }: { height: number; width: number }) => (
        <KeplerGl
          mapboxApiAccessToken={mapboxApiAccessToken}
          id="map"
          width={width}
          height={height}
        />
      )}
    </AutoSizer>
  </div>
);

const mapStateToProps = (state: KeplerGlState) => state;
const dispatchToProps = (dispatch: Dispatch<any>) => ({ dispatch });
const ConnectedApp = connect(mapStateToProps, dispatchToProps)(App);

interface KeplerMapProps {
  mapboxApiAccessToken: string;
}

const KeplerMap: React.FC<KeplerMapProps> = ({ mapboxApiAccessToken }) => (
  <Provider store={store}>
    <ConnectedApp mapboxApiAccessToken={mapboxApiAccessToken} />
  </Provider>
);

export default KeplerMap;
