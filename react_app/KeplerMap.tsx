// SPDX-License-Identifier: MIT
// Copyright contributors to the kepler.gl project

/** @jsxImportSource react */
import React, { useEffect, useMemo } from "react";
import type { Dispatch } from "react";
import { connect, Provider } from "react-redux";

import { applyMiddleware, combineReducers, compose, createStore } from "redux";
import KeplerGl from "@kepler.gl/components";
import keplerGlReducer, {
  enhanceReduxMiddleware,
  type KeplerGlState,
} from "@kepler.gl/reducers";
import { addDataToMap } from "@kepler.gl/actions";
import { processRowObject } from "@kepler.gl/processors";

import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";

interface KeplerMapProps {
  mapboxApiAccessToken: string;
  dispatch: Dispatch<any>;
  isDarkMode?: boolean;
  onMapReady?: (addDataToMapFn: (payload: any) => void) => void;
}

const App: React.FC<KeplerMapProps> = ({
  mapboxApiAccessToken,
  dispatch,
  isDarkMode,
  onMapReady,
}) => {
  useEffect(() => {
    // Expose the addDataToMap function to the parent component
    if (onMapReady) {
      const addDataToMapFn = (payload: any) => {
        dispatch(addDataToMap(payload));
      };
      onMapReady(addDataToMapFn);
    }
  }, [dispatch, onMapReady]);

  return (
    <div
      style={{
        position: "absolute",
        width: "100vw",
        height: "100%",
      }}
    >
      <AutoSizer>
        {({ height, width }) => (
          <KeplerGl
            id="map"
            mapboxApiAccessToken={mapboxApiAccessToken}
            width={width}
            height={height}
          />
        )}
      </AutoSizer>
    </div>
  );
};

const mapStateToProps = (state: KeplerGlState) => state;
const dispatchToProps = (dispatch: Dispatch<any>) => ({ dispatch });
const ConnectedApp = connect(mapStateToProps, dispatchToProps)(App);

const KeplerMap: React.FC<{
  mapboxApiAccessToken: string;
  isDarkMode?: boolean;
  onMapReady?: (addDataToMapFn: (payload: any) => void) => void;
}> = (props) => {
  const { isDarkMode } = props;
  const store = useMemo(() => {
    const reducers = combineReducers({
      keplerGl: keplerGlReducer.initialState({
        uiState: { readOnly: false, currentModal: null, activeSidePanel: null },
        mapStyle: { styleType: isDarkMode ? "dark" : "light" },
        // UK default center
        mapState: {
          latitude: 52.029347152354966,
          longitude: -3.3639196875002217,
          zoom: 4,
        },
      }),
    });
    const middleWares = enhanceReduxMiddleware([]);
    const enhancers = applyMiddleware(...middleWares);
    return createStore(reducers, {}, compose(enhancers));
  }, [isDarkMode]);

  return (
    <Provider store={store}>
      <style>{`
        .bottom-widget__field-select {
          max-width: 85px !important;
        }
      `}</style>
      <ConnectedApp {...props} />
    </Provider>
  );
};

export default KeplerMap;
