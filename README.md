# Oligo Calculator

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.20842890.svg)](https://doi.org/10.5281/zenodo.20842890)

Molecular weight, extinction coefficient (&epsilon;<sub>260</sub>), concentration, melting temperature and mass spec for synthetic oligonucleotides, including modified ones.

**▶ Live tool:** https://oligocalculator.com

One HTML file. No framework, no build step, no dependencies. Every number is worked out in your browser.

## What it does

**Molecular weight**

- DNA, RNA and hybrid strands
- Phosphorothioate and mixed backbones, bond by bond
- 5′ and 3′ end groups: phosphate, di- and triphosphate, DMT, inverted bases
- 2′ sugar modifications: 2′-OMe, 2′-F, 2′-MOE, LNA and cEt
- Custom monomers and conjugates you define once and reuse, with elemental formulas
- Duplexes for siRNA and ASO work: sense, antisense and duplex mass together
- Average mass, monoisotopic mass and the elemental formula

**Melting temperature**

- Nearest-neighbour thermodynamics, with the published parameter set named on screen
- DNA/DNA, DNA/RNA and RNA/RNA, plus hairpin and self-structure folding
- Salt corrections, and the PCR case where K⁺, Mg²⁺ and dNTP matter
- A per-residue coverage badge that tells you how much of *your* strand the model actually covers, rather than quietly extrapolating

**Concentration**

- Nanodrop A<sub>260</sub> or ng/µL to molarity, using the sequence's own &epsilon;<sub>260</sub>
- Dilution recipes, C₁V₁ = C₂V₂, with the volumes to pipette
- An &epsilon;<sub>260</sub> quality badge, because a nearest-neighbour coefficient is not equally good for every chemistry

**Mass spec**

- Exact mass and elemental formula
- The ESI m/z ladder, negative and positive, with Na⁺ and K⁺ adducts
- The rows that land in a typical instrument's collection range are marked

**Working with your strands**

- A library of saved strands, searchable, exportable to CSV
- A vendor catalog of verified phosphoramidites, with codes you can type or insert
- Read a sequence off a tube label or a page with your camera
- Voice entry
- Share a strand as a link, with no account needed at either end
- English, 繁體中文 and 简体中文
- Installable as an app, and it works offline

## Usage

Open the live link, or download `index.html` and open it in any browser. Nothing is installed and nothing is sent anywhere: the calculator runs entirely in the page. An account is optional and only adds syncing your library between devices.

**Check every mass before you pipette.**

## How to cite

If this calculator supports your research, please cite it:

> Chen, Y.-S. (2026). *Oligo MW & Concentration Calculator*. Zenodo. https://doi.org/10.5281/zenodo.20842890

The tool is now called **Oligo Calculator**, but the deposited record keeps the title it was published under, so that is the title to cite.

The DOI `10.5281/zenodo.20842890` is the concept DOI and always resolves to the latest version. A [`CITATION.cff`](CITATION.cff) is included, so you can also use GitHub's **"Cite this repository"** button for APA/BibTeX.

## Author

**Yu-Sheng Chen**, a PhD candidate in RNA chemistry in New York, building this out of pocket.

The site is independent: not affiliated with, funded by or endorsed by any university.

## License

**Not settled yet, so no licence is granted.**

An ownership determination is in progress. Until it is issued in writing there is no licence file here and none is implied, which means the default applies: all rights reserved. You are welcome to use the tool at the link above, and to cite it. Please do not redistribute or fork the source until this section says you may.

This will be replaced with a real licence as soon as there is one to state.
