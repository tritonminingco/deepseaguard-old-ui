# Fourier Series Algorithm for Robotics
# This script implements a Fourier series algorithm to model periodic signals
# commonly encountered in robotics, such as motor vibrations, sensor noise,
# and control signals.

import numpy as np
import matplotlib.pyplot as plt

# Function to compute the Fourier series approximation of a periodic function
def fourier_series(func, T, n_terms, t):
    """
    Compute the Fourier series approximation of a given function.

    Parameters:
    - func: The original periodic function (callable).
    - T: The period of the function.
    - n_terms: Number of terms in the Fourier series.
    - t: Time points at which to evaluate the series.

    Returns:
    - Approximation of the function at the given time points.
    """
    # Fundamental frequency
    omega = 2 * np.pi / T

    # Compute the Fourier coefficients
    a0 = (2 / T) * np.trapz([func(x) for x in np.linspace(0, T, 1000)], np.linspace(0, T, 1000))
    result = a0 / 2

    for n in range(1, n_terms + 1):
        an = (2 / T) * np.trapz([func(x) * np.cos(n * omega * x) for x in np.linspace(0, T, 1000)], np.linspace(0, T, 1000))
        bn = (2 / T) * np.trapz([func(x) * np.sin(n * omega * x) for x in np.linspace(0, T, 1000)], np.linspace(0, T, 1000))
        result += an * np.cos(n * omega * t) + bn * np.sin(n * omega * t)

    return result

# Example usage: Model a square wave signal
def square_wave(t):
    """Square wave function with period 2*pi."""
    return 1 if (t % (2 * np.pi)) < np.pi else -1

if __name__ == "__main__":
    # Define parameters
    period = 2 * np.pi  # Period of the square wave
    n_terms = 10        # Number of Fourier terms
    t = np.linspace(0, 2 * period, 1000)  # Time points

    # Compute Fourier series approximation
    approx = fourier_series(square_wave, period, n_terms, t)

    # Plot the original function and its Fourier approximation
    plt.figure(figsize=(10, 6))
    plt.plot(t, [square_wave(x) for x in t], label="Original Square Wave", linestyle="--")
    plt.plot(t, approx, label=f"Fourier Approximation ({n_terms} terms)")
    plt.title("Fourier Series Approximation of a Square Wave")
    plt.xlabel("Time")
    plt.ylabel("Amplitude")
    plt.legend()
    plt.grid()
    plt.show()