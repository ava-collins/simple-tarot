import React, { useEffect, useMemo, useReducer } from 'react';
import { View } from 'react-native';

type SharedValue<T> = {
    value: T;
    addListener: (listener: () => void) => () => void;
};

const createSharedValue = <T,>(initialValue: T): SharedValue<T> => {
    let currentValue = initialValue;
    const listeners = new Set<() => void>();

    return {
        get value() {
            return currentValue;
        },
        set value(nextValue) {
            currentValue = nextValue;
            listeners.forEach(listener => listener());
        },
        addListener(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        }
    };
};

const isSharedValue = (value: unknown): value is SharedValue<unknown> =>
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    'addListener' in value;

const collectSharedValues = (value: unknown, values = new Set<SharedValue<unknown>>()) => {
    if (isSharedValue(value)) {
        values.add(value);
        return values;
    }

    if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(nestedValue =>
            collectSharedValues(nestedValue, values)
        );
    }

    return values;
};

export const Easing = {
    linear: 'linear'
};

export function useSharedValue<T>(initialValue: T) {
    return useMemo(() => createSharedValue(initialValue), []);
}

export function withTiming<T>(toValue: T) {
    return toValue;
}

export function useAnimatedStyle(updater: () => Record<string, unknown>) {
    const [, forceRender] = useReducer(value => value + 1, 0);
    const sharedValues = useMemo(
        () => collectSharedValues((updater as { __closure?: unknown }).__closure),
        [updater]
    );

    useEffect(() => {
        const removeListeners = Array.from(sharedValues).map(sharedValue =>
            sharedValue.addListener(forceRender)
        );

        return () => removeListeners.forEach(removeListener => removeListener());
    }, [sharedValues]);

    const style = updater();

    if ('transform' in style) {
        return {
            ...style,
            transitionProperty: 'transform',
            transitionDuration: '100ms',
            transitionTimingFunction: 'linear'
        };
    }

    return style;
}

const AnimatedView = React.forwardRef<React.ComponentRef<typeof View>, React.ComponentProps<typeof View>>(
    (props, ref) => <View {...props} ref={ref} />
);

AnimatedView.displayName = 'Animated.View';

const Animated = {
    View: AnimatedView
};

export default Animated;
