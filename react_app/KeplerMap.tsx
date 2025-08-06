// SPDX-License-Identifier: MIT
// Copyright contributors to the kepler.gl project

/** @jsxImportSource react */
import React, { useEffect } from "react";
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

// 1. Setup Redux store with keplerGl
const reducers = combineReducers({
  keplerGl: keplerGlReducer.initialState({
    uiState: { readOnly: false, currentModal: null, activeSidePanel: null },
    mapStyle: {
      styleType: "dark", // `voyager` or `dark`, TODO follow system
    },
  }),
});
const middleWares = enhanceReduxMiddleware([]);
const enhancers = applyMiddleware(...middleWares);
const store = createStore(reducers, {}, compose(enhancers));

interface KeplerMapProps {
  mapboxApiAccessToken: string;
  apiUrl: string;
  dispatch: Dispatch<any>;
}

const App: React.FC<KeplerMapProps> = ({
  mapboxApiAccessToken,
  apiUrl,
  dispatch,
}) => {
  useEffect(() => {
    // Fetch parsed observations from Nuxt API
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        dispatch(
          addDataToMap({
            datasets: [
              {
                info: { label: "Barn Owl Observations", id: "barn_owl_obs" },
                data: processRowObject(data) ?? { fields: [], rows: [] },
              },
            ],
            options: { centerMap: false },
            config: {
              visState: {
                layers: [
                  {
                    id: "barn_owls_layer",
                    type: "point",
                    config: {
                      dataId: "barn_owl_obs",
                      label: "Barn Owls",
                      color: [18, 147, 154],
                      columns: { lat: "lat", lng: "lng" },
                      isVisible: true,
                      visConfig: {
                        radius: 10,
                        fixedRadius: false,
                        opacity: 0.8,
                        outline: false,
                        thickness: 2,
                        filled: true,
                        radiusRange: [0, 50],
                      },
                    },
                  },
                ],
                filters: [
                  {
                    dataId: ["barn_owl_obs"],
                    id: "filter_eventDate",
                    name: ["eventDate"],
                    type: "timeRange",
                    value: [1600000000000, 1752962400000],
                    plotType: {
                      interval: "1-week",
                      defaultTimeFormat: "L",
                      type: "histogram",
                      aggregation: "sum",
                    },
                    view: "enlarged",
                    speed: 1,
                  },
                ],
              },
              mapState: {
                bearing: 0,
                dragRotate: false,
                latitude: 52.029347152354966,
                longitude: -3.3639196875002217,
                pitch: 0,
                zoom: 4,
                isSplit: false,
              },
            },
          })
        );
      });
  }, [apiUrl, dispatch]);

  return (
    <div
      style={{
        position: "absolute",
        top: "80px",
        left: 0,
        width: "100%",
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

const KeplerMap: React.FC<{ mapboxApiAccessToken: string; apiUrl: string }> = (
  props
) => (
  <Provider store={store}>
    <ConnectedApp {...props} />
  </Provider>
);

export default KeplerMap;
