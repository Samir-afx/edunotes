/**
 * ============================================================================
 * MAKAUT CSE FIRST-YEAR SYLLABUS — OFFICIAL ACADEMIC SOURCE OF TRUTH
 * Maulana Abul Kalam Azad University of Technology, West Bengal
 * Bachelor of Technology (B.Tech) First Year Curriculum (AICTE Model Framework)
 * ============================================================================
 */

window.MAKAUT_SYLLABUS = {
  university: 'Maulana Abul Kalam Azad University of Technology, West Bengal (MAKAUT)',
  curriculum: 'B.Tech First Year (Semester I & Semester II) — CSE / Allied Branches',
  academicRegulation: 'Outcome-Based Education (OBE) Framework',

  // --------------------------------------------------------------------------
  // PROGRAMME OUTCOMES (PO1 - PO12)
  // --------------------------------------------------------------------------
  programmeOutcomes: [
    { code: 'PO1', title: 'Engineering Knowledge', desc: 'Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems.' },
    { code: 'PO2', title: 'Problem Analysis', desc: 'Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences.' },
    { code: 'PO3', title: 'Design/Development of Solutions', desc: 'Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for public health and safety, and cultural, societal, and environmental considerations.' },
    { code: 'PO4', title: 'Conduct Investigations of Complex Problems', desc: 'Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions.' },
    { code: 'PO5', title: 'Modern Tool Usage', desc: 'Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities with an understanding of the limitations.' },
    { code: 'PO6', title: 'The Engineer and Society', desc: 'Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice.' },
    { code: 'PO7', title: 'Environment and Sustainability', desc: 'Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development.' },
    { code: 'PO8', title: 'Ethics', desc: 'Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice.' },
    { code: 'PO9', title: 'Individual and Team Work', desc: 'Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.' },
    { code: 'PO10', title: 'Communication', desc: 'Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation, make effective presentations, and give and receive clear instructions.' },
    { code: 'PO11', title: 'Project Management and Finance', desc: 'Demonstrate knowledge and understanding of the engineering and management principles and apply these to one’s own work, as a member and leader in a team, to manage projects and in multidisciplinary environments.' },
    { code: 'PO12', title: 'Life-Long Learning', desc: 'Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.' }
  ],

  // --------------------------------------------------------------------------
  // CLASS XII PREREQUISITE & BRIDGE MODULES
  // --------------------------------------------------------------------------
  bridgePrerequisites: [
    { subject: 'Mathematics Bridge', topics: ['Limits, Continuity & Standard Differentiation Formulas', 'Integration by parts, substitution & partial fractions', 'Basic Coordinate Geometry (Conics: Parabola, Ellipse, Hyperbola)', 'Matrix Determinants, Cramer\'s Rule & Vector Algebra'] },
    { subject: 'Physics Bridge', topics: ['Wave motion, Superposition Principle & Doppler Effect', 'Ray Optics (Reflection, Refraction, Total Internal Reflection)', 'Electrostatics (Coulomb\'s Law, Gauss Theorem)', 'Dual Nature of Radiation and Matter, Bohr\'s Atomic Model'] },
    { subject: 'Chemistry Bridge', topics: ['Periodic Table Trends, Chemical Bonding (Hybridization, VSEPR)', 'Thermodynamic Laws (Enthalpy, Entropy, Gibbs Free Energy)', 'Electrochemistry (Galvanic Cells, Redox reactions)', 'Organic Chemistry basics (IUPAC nomenclature, functional groups)'] },
    { subject: 'Computing Bridge', topics: ['Number Systems (Binary, Octal, Hexadecimal, 2\'s Complement)', 'Basic Algorithmic Flowcharts & Pseudocode', 'Logic Gates (AND, OR, NOT, XOR, NAND, NOR)'] }
  ],

  // --------------------------------------------------------------------------
  // GROUP ROTATION RULES
  // --------------------------------------------------------------------------
  groupRotation: {
    groupA: {
      branches: 'CSE, IT, ECE, AI&ML, Data Science, IoT',
      sem1: 'Physics-I + Basic Electrical Engg (BEEE) + English + Engineering Graphics',
      sem2: 'Chemistry-I + Programming for Problem Solving (C) + Basic Electronics + Workshop/Manufacturing'
    },
    groupB: {
      branches: 'EE, ME, CE, Chemical, Biotechnology',
      sem1: 'Chemistry-I + Programming for Problem Solving (C) + Workshop/Manufacturing',
      sem2: 'Physics-I + Basic Electrical Engg (BEEE) + English + Engineering Graphics'
    }
  },

  // --------------------------------------------------------------------------
  // SEMESTER I COURSES (MAKAUT OFFICIAL)
  // --------------------------------------------------------------------------
  semester1: [
    {
      id: 'BS-M101',
      code: 'BS-M101 / BS-M102',
      name: 'Mathematics – I (Calculus & Linear Algebra)',
      semester: 'Semester I',
      courseType: 'Theory',
      credits: 4,
      ltp: '3-1-0',
      contactHours: 40,
      description: 'Covers differential & integral calculus of single and multivariable functions, infinite series, matrix operations, rank, eigenvalues, and Cayley-Hamilton theorem.',
      courseOutcomes: [
        { code: 'CO1', desc: 'Apply mathematical principles of Rolle\'s theorem, Mean value theorem and Taylor\'s series to engineering functions.', bloom: 'L3 Apply' },
        { code: 'CO2', desc: 'Evaluate improper integrals, Beta and Gamma functions, and volume/surface of revolution.', bloom: 'L5 Evaluate' },
        { code: 'CO3', desc: 'Calculate partial derivatives, total differentials, Euler\'s theorem, and maxima/minima of multivariable functions.', bloom: 'L3 Apply' },
        { code: 'CO4', desc: 'Analyze systems of linear equations, matrix rank, vector spaces, and linear independence.', bloom: 'L4 Analyze' },
        { code: 'CO5', desc: 'Compute eigenvalues, eigenvectors, Cayley-Hamilton theorem, and diagonalize symmetric matrices.', bloom: 'L3 Apply' }
      ],
      modules: [
        {
          moduleNumber: 1,
          title: 'Module I · Calculus of Single Variable',
          hours: 8,
          topics: [
            'Evolutes and involutes; Evaluation of definite and improper integrals; Beta and Gamma functions and their properties',
            'Applications of definite integrals to evaluate surface areas and volumes of revolutions',
            'Rolle’s Theorem, Mean value theorems, Taylor’s and Maclaurin theorems with remainders; indeterminate forms and L\'Hospital\'s rule; Maxima and minima'
          ]
        },
        {
          moduleNumber: 2,
          title: 'Module II · Multivariable Calculus (Differentiation)',
          hours: 10,
          topics: [
            'Limit, continuity and partial derivatives, directional derivatives, total derivative; Tangent planes and normal lines',
            'Maxima, minima and saddle points; Method of Lagrange multipliers; Gradient, curl and divergence',
            'Euler’s Theorem on homogeneous functions and applications'
          ]
        },
        {
          moduleNumber: 3,
          title: 'Module III · Matrices & Systems of Linear Equations',
          hours: 10,
          topics: [
            'Matrices, vectors: addition and scalar multiplication, matrix multiplication; Rank of a matrix by echelon forms',
            'System of linear equations; Symmetric, skew-symmetric and orthogonal matrices; Determinants (definitions, properties and computation)',
            'Inverse of a matrix by Gauss-Jordan elimination method'
          ]
        },
        {
          moduleNumber: 4,
          title: 'Module IV · Vector Spaces & Linear Transformations',
          hours: 12,
          topics: [
            'Vector Space, linear dependence of vectors, basis, dimension; Linear transformations (maps), range and kernel of a linear map, rank-nullity theorem',
            'Eigenvalues, eigenvectors, symmetric, skew-symmetric, and orthogonal Matrices, eigenbases',
            'Diagonalization of matrices; Cayley-Hamilton Theorem, Orthogonal transformation and quadratic forms'
          ]
        }
      ],
      books: [
        'G.B. Thomas and R.L. Finney, Calculus and Analytic geometry, 9th Edition, Pearson.',
        'Erwin Kreyszig, Advanced Engineering Mathematics, 9th Edition, John Wiley & Sons.',
        'D. Poole, Linear Algebra: A Modern Introduction, 2nd Edition, Brooks/Cole.'
      ]
    },
    {
      id: 'BS-PH101',
      code: 'BS-PH101',
      name: 'Physics – I (Waves, Optics & Quantum Mechanics)',
      semester: 'Semester I',
      courseType: 'Theory',
      credits: 4,
      ltp: '3-1-0',
      contactHours: 38,
      description: 'Comprehensive study of wave optics, electromagnetic field theory, quantum mechanics, lasers, and fiber optics for engineering applications.',
      courseOutcomes: [
        { code: 'CO1', desc: 'Explain physical optics phenomena including interference, diffraction, and polarization.', bloom: 'L2 Understand' },
        { code: 'CO2', desc: 'Apply Maxwell\'s equations and Poynting theorem to electromagnetic wave propagation.', bloom: 'L3 Apply' },
        { code: 'CO3', desc: 'Formulate Schrodinger equation for 1D potential well and analyze quantum particle behavior.', bloom: 'L4 Analyze' },
        { code: 'CO4', desc: 'Illustrate operating mechanisms of Ruby, He-Ne lasers, and optical fiber communications.', bloom: 'L2 Understand' }
      ],
      modules: [
        {
          moduleNumber: 1,
          title: 'Module I · Wave Optics & Interference',
          hours: 10,
          topics: [
            'Huygens’ principle, superposition of waves and interference of light by wave front splitting and amplitude splitting',
            'Young’s double slit experiment, Newton’s rings, Michelson interferometer, Mach-Zehnder interferometer',
            'Fraunhofer diffraction from a single slit and a circular aperture, the Rayleigh criterion for limit of resolution and its application to vision; Diffraction gratings and their resolving power'
          ]
        },
        {
          moduleNumber: 2,
          title: 'Module II · Electromagnetic Field Theory',
          hours: 8,
          topics: [
            'Laws of electrostatics, Calculation of electric field and electrostatic potential for a charge distribution; Divergence and curl of electrostatic field',
            'Laplace’s and Poisson’s equations for electrostatic potential and uniqueness theorem',
            'Biot-Savart law, Divergence and curl of static magnetic field; Ampere’s law; Maxwell’s displacement current, Maxwell’s equations in vacuum and dielectric media; Poynting vector'
          ]
        },
        {
          moduleNumber: 3,
          title: 'Module III · Quantum Mechanics',
          hours: 12,
          topics: [
            'Wave nature of particles, De Broglie hypothesis, Heisenberg uncertainty principle, wave function, probability density and normalization',
            'Schrodinger time-dependent and time-independent wave equations',
            'Particle in a 1D rigid box, infinite potential well, energy eigenvalues, eigenfunctions, expectation values'
          ]
        },
        {
          moduleNumber: 4,
          title: 'Module IV · Lasers & Optical Fibers',
          hours: 8,
          topics: [
            'Einstein’s theory of matter radiation interaction and A and B coefficients; Amplification of light by population inversion',
            'Different types of lasers: gas lasers (He-Ne), solid-state lasers (Ruby, Nd:YAG); Properties of laser beams: mono-chromaticity, coherence, directionality',
            'Fibre Optics: Introduction, total internal reflection, numerical aperture, acceptance angle, V-number, single and multi-mode fibres'
          ]
        }
      ],
      books: [
        'David Griffiths, Introduction to Electrodynamics, 3rd Edition, Pearson.',
        'E. Hecht, Optics, 4th Edition, Pearson Education.',
        'Arthur Beiser, Concepts of Modern Physics, 6th Edition, Tata McGraw Hill.'
      ]
    },
    {
      id: 'ES-EE101',
      code: 'ES-EE101',
      name: 'Basic Electrical Engineering (BEEE)',
      semester: 'Semester I',
      courseType: 'Theory',
      credits: 3,
      ltp: '3-0-0',
      contactHours: 36,
      description: 'Fundamentals of DC and AC circuit theorems, resonance, single phase transformers, three phase systems, and electrical rotating machinery.',
      courseOutcomes: [
        { code: 'CO1', desc: 'Analyze DC electrical circuits using KCL, KVL, Thevenin, Norton, and Superposition theorems.', bloom: 'L4 Analyze' },
        { code: 'CO2', desc: 'Evaluate steady-state AC behavior of R-L-C circuits, power factor, and resonance.', bloom: 'L5 Evaluate' },
        { code: 'CO3', desc: 'Explain construction, working principle, losses, and efficiency of single phase transformers.', bloom: 'L2 Understand' },
        { code: 'CO4', desc: 'Understand working characteristics of DC machines and 3-phase induction motors.', bloom: 'L2 Understand' }
      ],
      modules: [
        {
          moduleNumber: 1,
          title: 'Module I · DC Circuits Analysis & Network Theorems',
          hours: 8,
          topics: [
            'Electrical circuit elements (R, L and C), voltage and current sources, Kirchhoff current and voltage laws',
            'Analysis of simple circuits with dc excitation. Superposition, Thevenin, Norton and Maximum Power Transfer Theorems',
            'Star-Delta conversion and mesh/nodal analysis'
          ]
        },
        {
          moduleNumber: 2,
          title: 'Module II · AC Fundamentals & Resonance',
          hours: 10,
          topics: [
            'Representation of sinusoidal waveforms, peak and rms values, phasor representation, real power, reactive power, apparent power, power factor',
            'Analysis of single-phase ac circuits consisting of R, L, C, RL, RC, RLC combinations (series and parallel)',
            'Series and parallel resonance, bandwidth and quality factor (Q-factor); Three-phase balanced circuits, voltage and current relations in star and delta connections'
          ]
        },
        {
          moduleNumber: 3,
          title: 'Module III · Transformers',
          hours: 8,
          topics: [
            'Magnetic materials, BH characteristics, ideal and practical transformer, equivalent circuit, losses in transformers, regulation and efficiency',
            'Auto-transformer and three-phase transformer connections'
          ]
        },
        {
          moduleNumber: 4,
          title: 'Module IV · Electrical Machines & Power Converters',
          hours: 10,
          topics: [
            'Generation of rotating magnetic fields, Construction and working of a three-phase induction motor, Significance of torque-slip characteristic',
            'Starting and speed control of induction motor; Construction and working of single-phase induction motor; Construction, working, torque-speed characteristic and speed control of separately excited dc motor',
            'Introduction to components of LT Switchgear: Switch Fuse Unit (SFU), MCB, ELCB, MCCB, Types of Wires and Cables, Earthing'
          ]
        }
      ],
      books: [
        'D. P. Kothari and I. J. Nagrath, Basic Electrical Engineering, Tata McGraw Hill.',
        'V. D. Toro, Electrical Engineering Fundamentals, Prentice Hall India.',
        'L. S. Bobrow, Fundamentals of Electrical Engineering, Oxford University Press.'
      ]
    },
    {
      id: 'HM-HU101',
      code: 'HM-HU101',
      name: 'English for Communication',
      semester: 'Semester I',
      courseType: 'Theory',
      credits: 2,
      ltp: '2-0-0',
      contactHours: 24,
      description: 'Developing communication skills, grammatical precision, technical report writing, vocabulary building, and professional business correspondence.',
      courseOutcomes: [
        { code: 'CO1', desc: 'Apply structural grammar and vocabulary in technical writing and communication.', bloom: 'L3 Apply' },
        { code: 'CO2', desc: 'Compose technical reports, executive summaries, resumes, and formal emails.', bloom: 'L6 Create' }
      ],
      modules: [
        {
          moduleNumber: 1,
          title: 'Module I · Vocabulary Building & Sentence Structures',
          hours: 6,
          topics: [
            'The concept of Word Formation: Root words from foreign languages and their use in English, Acquaintance with prefixes and suffixes',
            'Synonyms, antonyms, and standard abbreviations; Sentence Structures, Clauses, Phrases, Subject-verb agreement'
          ]
        },
        {
          moduleNumber: 2,
          title: 'Module II · Professional Writing & Reading Comprehension',
          hours: 10,
          topics: [
            'Identifying common errors in writing (Tenses, prepositions, misplaced modifiers)',
            'Techniques for writing precisely: Précis writing, Summarizing, Paraphrasing',
            'Business Letters, Job Application and Resume Writing, Technical Report Writing, Email etiquette'
          ]
        },
        {
          moduleNumber: 3,
          title: 'Module III · Oral Communication Skills',
          hours: 8,
          topics: [
            'Listening Comprehension, Pronunciation, Intonation, Stress and Rhythm',
            'Common Everyday Situations: Conversations and Dialogues; Group Discussion strategies and formal presentations'
          ]
        }
      ],
      books: [
        'Practical English Usage. Michael Swan. OUP. 1995.',
        'Remedial English Grammar. F.T. Wood. Macmillan. 2007.',
        'On Writing Well. William Zinsser. Harper Resource Book. 2001.'
      ]
    },
    // PRACTICALS
    {
      id: 'BS-PH191',
      code: 'BS-PH191',
      name: 'Physics – I Laboratory',
      semester: 'Semester I',
      courseType: 'Practical',
      credits: 1.5,
      ltp: '0-0-3',
      contactHours: 36,
      description: 'Hands-on experiments demonstrating physical optics, electromagnetic induction, Planck constant determination, and semiconductor measurements.',
      experiments: [
        { num: 1, title: 'Newton\'s Rings Experiment', desc: 'Determination of radius of curvature of a plano-convex lens by measuring ring diameters using travelling microscope.' },
        { num: 2, title: 'Diffraction Grating', desc: 'Determination of wavelength of spectral lines of mercury vapor lamp using plane transmission diffraction grating.' },
        { num: 3, title: 'Planck\'s Constant Determination', desc: 'Measurement of Planck\'s constant using Light Emitting Diodes (LEDs) of varying bandgap wavelengths.' },
        { num: 4, title: 'Band Gap Measurement', desc: 'Determination of energy band gap of a semiconductor by reverse bias Four Probe / PN junction method.' },
        { num: 5, title: 'Hall Effect Experiment', desc: 'Determination of Hall coefficient, carrier concentration, and mobility of charge carriers in a semiconductor specimen.' },
        { num: 6, title: 'Dispersive Power of Prism', desc: 'Determination of dispersive power of the material of a prism using spectrometer.' }
      ]
    },
    {
      id: 'ES-EE191',
      code: 'ES-EE191',
      name: 'Basic Electrical Engineering Laboratory',
      semester: 'Semester I',
      courseType: 'Practical',
      credits: 1,
      ltp: '0-0-2',
      contactHours: 24,
      description: 'Laboratory verification of fundamental electrical circuit theorems, transformer performance, and AC resonance.',
      experiments: [
        { num: 1, title: 'Verification of Thevenin\'s & Norton\'s Theorems', desc: 'Experimental verification of Thevenin and Norton equivalent circuits under varying resistive loads.' },
        { num: 2, title: 'Superposition Theorem Verification', desc: 'Verification of linearity and superposition in a multi-source DC resistive bridge network.' },
        { num: 3, title: 'Series R-L-C Resonance', desc: 'Study of frequency response, determination of resonance frequency, bandwidth, and quality factor in series RLC circuit.' },
        { num: 4, title: 'Single Phase Transformer Open & Short Circuit Tests', desc: 'Determination of core loss, copper loss, equivalent circuit parameters, and efficiency regulation.' },
        { num: 5, title: '3-Phase Power Measurement by Two-Wattmeter Method', desc: 'Measurement of active and reactive power in balanced 3-phase star and delta loads.' }
      ]
    },
    {
      id: 'ES-ME191',
      code: 'ES-ME191',
      name: 'Engineering Graphics & Design',
      semester: 'Semester I',
      courseType: 'Practical',
      credits: 3,
      ltp: '1-0-4',
      contactHours: 60,
      description: 'Engineering drawing principles, orthographic projections of points, lines, planes, solids, isometric views, sectioning, and AutoCAD software drafting.',
      experiments: [
        { num: 1, title: 'Lettering, Dimensioning & Scales', desc: 'Standard lettering formats (BIS SP 46:2003), plain scales, and diagonal scales.' },
        { num: 2, title: 'Orthographic Projection of Points & Lines', desc: 'Projection in 1st and 3rd angle quadrants, true lengths, and inclinations with reference planes.' },
        { num: 3, title: 'Projection of Planes & Solids', desc: 'Projections of regular prisms, pyramids, cylinders, and cones inclined to reference planes.' },
        { num: 4, title: 'Isometric Projections', desc: 'Construction of isometric views and isometric projections from given orthographic elevations and plans.' },
        { num: 5, title: 'Computer Aided Drafting (AutoCAD)', desc: '2D drafting commands (Line, Circle, Arc, Trim, Offset, Fillet, Dimensioning, Layer Management).' }
      ]
    }
  ],

  // --------------------------------------------------------------------------
  // SEMESTER II COURSES (MAKAUT OFFICIAL)
  // --------------------------------------------------------------------------
  semester2: [
    {
      id: 'BS-M201',
      code: 'BS-M201 / BS-M202',
      name: 'Mathematics – II (Differential Equations & Vector Calculus)',
      semester: 'Semester II',
      courseType: 'Theory',
      credits: 4,
      ltp: '3-1-0',
      contactHours: 40,
      description: 'First order and higher order ordinary differential equations, series solutions, Laplace transforms, vector differential & integral calculus (Green, Stokes, Gauss Divergence theorems).',
      courseOutcomes: [
        { code: 'CO1', desc: 'Solve first order ODEs (exact, linear, Bernoulli) and apply to orthogonal trajectories and electrical RL circuits.', bloom: 'L3 Apply' },
        { code: 'CO2', desc: 'Compute higher order linear differential equations with constant coefficients and variation of parameters.', bloom: 'L3 Apply' },
        { code: 'CO3', desc: 'Apply Laplace transforms and inverse Laplace transforms to solve initial value differential equations.', bloom: 'L3 Apply' },
        { code: 'CO4', desc: 'Evaluate line, surface, and volume integrals using Green\'s, Stokes\', and Gauss Divergence theorems.', bloom: 'L5 Evaluate' }
      ],
      modules: [
        {
          moduleNumber: 1,
          title: 'Module I · First Order Ordinary Differential Equations',
          hours: 8,
          topics: [
            'Exact, linear and Bernoulli’s equations, Euler’s equations, Equations not of first degree: equations solvable for p, equations solvable for y, equations solvable for x and Clairaut’s type',
            'Applications: Orthogonal trajectories, Newton’s Law of cooling, Simple electric circuits (RL, RC)'
          ]
        },
        {
          moduleNumber: 2,
          title: 'Module II · Higher Order Linear Differential Equations',
          hours: 10,
          topics: [
            'Second order linear differential equations with constant coefficients, Method of variation of parameters, Cauchy-Euler equation',
            'Power series solutions: Legendre polynomials, Bessel functions of the first kind and their properties'
          ]
        },
        {
          moduleNumber: 3,
          title: 'Module III · Laplace Transform & Applications',
          hours: 10,
          topics: [
            'Laplace Transform, Properties of Laplace Transform, Laplace transform of periodic functions',
            'Inverse Laplace Transform, Convolution theorem, Evaluation of integrals by Laplace transform, Solving ordinary differential equations with initial values'
          ]
        },
        {
          moduleNumber: 4,
          title: 'Module IV · Vector Integration & Integral Theorems',
          hours: 12,
          topics: [
            'Vector line integrals, surface integrals, volume integrals, Path independence and conservative fields',
            'Green’s theorem in a plane, Stokes’ theorem, Gauss Divergence theorem (without proof) and engineering boundary value verification'
          ]
        }
      ],
      books: [
        'Erwin Kreyszig, Advanced Engineering Mathematics, John Wiley & Sons.',
        'W. E. Boyce and R. C. DiPrima, Elementary Differential Equations and Boundary Value Problems, Wiley India.',
        'S. L. Ross, Differential Equations, 3rd Ed., Wiley India.'
      ]
    },
    {
      id: 'BS-CH101',
      code: 'BS-CH101',
      name: 'Chemistry – I (Molecular Structure, Thermodynamics & Polymers)',
      semester: 'Semester II',
      courseType: 'Theory',
      credits: 4,
      ltp: '3-1-0',
      contactHours: 38,
      description: 'Molecular orbital theory, spectroscopic methods (UV-Vis, IR, NMR), chemical thermodynamics, electrochemistry, corrosion, polymers, and green chemistry.',
      courseOutcomes: [
        { code: 'CO1', desc: 'Analyze molecular orbital diagrams of diatomic molecules and crystal field splitting in complexes.', bloom: 'L4 Analyze' },
        { code: 'CO2', desc: 'Interpret spectroscopic data from UV-Vis, IR, and NMR for chemical structural elucidation.', bloom: 'L4 Analyze' },
        { code: 'CO3', desc: 'Apply Nernst equation and electrochemical principles to corrosion mitigation and battery energy storage.', bloom: 'L3 Apply' },
        { code: 'CO4', desc: 'Explain synthesis and properties of conducting polymers, biodegradable plastics, and nanomaterials.', bloom: 'L2 Understand' }
      ],
      modules: [
        {
          moduleNumber: 1,
          title: 'Module I · Atomic & Molecular Structure',
          hours: 10,
          topics: [
            'Schrodinger equation. Particle in a box solutions. Molecular orbitals of diatomic molecules and plots of the multicenter orbitals',
            'Equations for atomic and molecular orbitals. Energy level diagrams of diatomics (N2, O2, CO, NO). Pi-molecular orbitals of butadiene and benzene and aromaticity',
            'Crystal field theory and the energy level diagrams for transition metal ions and their magnetic properties; Band structure of solids and the role of doping on band energy'
          ]
        },
        {
          moduleNumber: 2,
          title: 'Module II · Spectroscopic Techniques & Applications',
          hours: 8,
          topics: [
            'Principles of spectroscopy and selection rules. Electronic spectroscopy (UV-Vis) and Woodward-Fieser rules',
            'Vibrational and rotational spectroscopy (IR) of diatomic molecules. Applications in functional group identification',
            'Nuclear magnetic resonance (1H-NMR) and magnetic resonance imaging (MRI), chemical shift, spin-spin coupling'
          ]
        },
        {
          moduleNumber: 3,
          title: 'Module III · Chemical Thermodynamics & Phase Rule',
          hours: 10,
          topics: [
            'Thermodynamic functions: Energy, entropy and free energy. Estimations of entropy and free energies. Free energy and emf. Cell potentials, the Nernst equation and applications',
            'Acid base, oxidation reduction and solubility equilibria; Corrosion: Types, mechanism and prevention methods',
            'Phase Rule: Statement and explanation of terms (Phase, Component, Degrees of Freedom), one-component water system'
          ]
        },
        {
          moduleNumber: 4,
          title: 'Module IV · Polymers, Energy Storage & Nanomaterials',
          hours: 10,
          topics: [
            'Classification of polymers, mechanism of polymerization (Addition, Condensation), Conducting polymers (Polyaniline, Polyacetylene), Biodegradable polymers (PLA)',
            'Advanced Energy Materials: Lithium-ion batteries, Lead-acid accumulator, Hydrogen fuel cells',
            'Introduction to Nanomaterials: Carbon nanotubes (CNTs), Graphene, Quantum dots, sol-gel synthesis'
          ]
        }
      ],
      books: [
        'University Chemistry, by B. H. Mahan.',
        'Fundamentals of Molecular Spectroscopy, by C. N. Banwell.',
        'Engineering Chemistry (NPTEL Web-book), by B. L. Tembe, Kamaluddin and M. S. Krishnan.'
      ]
    },
    {
      id: 'ES-CS101',
      code: 'ES-CS101',
      name: 'Programming for Problem Solving (C Programming)',
      semester: 'Semester II',
      courseType: 'Theory',
      credits: 3,
      ltp: '3-0-0',
      contactHours: 36,
      description: 'Algorithmic problem solving, ANSI C syntax, control structures, arrays, pointers, user-defined functions, recursion, structures, unions, dynamic memory allocation, and file processing.',
      courseOutcomes: [
        { code: 'CO1', desc: 'Design flowcharts and algorithms for computational logic problems.', bloom: 'L6 Create' },
        { code: 'CO2', desc: 'Implement modular programs using C control structures, loops, arrays, and functions.', bloom: 'L3 Apply' },
        { code: 'CO3', desc: 'Apply pointer arithmetic, dynamic memory allocation (malloc/calloc), and structures for data organization.', bloom: 'L3 Apply' },
        { code: 'CO4', desc: 'Construct search (linear/binary) and sorting algorithms (bubble, insertion, selection) with file handling.', bloom: 'L3 Apply' }
      ],
      modules: [
        {
          moduleNumber: 1,
          title: 'Module I · Fundamentals of Computing & Algorithms',
          hours: 8,
          topics: [
            'Introduction to components of a computer system (disks, memory, processor, where a program is stored and executed, operating system, compilers)',
            'Idea of Algorithm: steps to solve logical and numerical problems. Representation of Algorithm: Flowchart/Pseudocode with examples',
            'From algorithms to programs; source code, variables (with data types), variables and memory locations, Syntax and Logical Errors in compilation, object and executable code'
          ]
        },
        {
          moduleNumber: 2,
          title: 'Module II · Control Structures, Loops & Arrays',
          hours: 10,
          topics: [
            'Arithmetic expressions and precedence; Conditional Branching and Loops: Writing and evaluation of conditionals and consequent branching, Iteration and loops (for, while, do-while)',
            'Arrays: 1-D, 2-D arrays (Character arrays and Strings), matrix multiplication and 2D matrix manipulation'
          ]
        },
        {
          moduleNumber: 3,
          title: 'Module III · Functions, Recursion & Pointers',
          hours: 10,
          topics: [
            'Functions (including using built in libraries), Parameter passing in functions, call by value, Passing arrays to functions',
            'Recursion: Definition, recursion trees, Towers of Hanoi, Factorial, Fibonacci, GCD computation',
            'Pointers: Defining pointers, pointer arithmetic, passing pointers to functions, call by reference, Arrays of Pointers'
          ]
        },
        {
          moduleNumber: 4,
          title: 'Module IV · Structures, Dynamic Memory & File I/O',
          hours: 8,
          topics: [
            'Structures: Defining structures, array of structures, nested structures, Unions',
            'Dynamic Memory Allocation: malloc(), calloc(), realloc(), free() functions and memory leaks',
            'File Handling in C: fopen, fclose, fscanf, fprintf, fread, fwrite, text vs binary files'
          ]
        }
      ],
      books: [
        'Byron Gottfried, Schaum\'s Outline of Programming with C, McGraw-Hill.',
        'E. Balaguruswamy, Programming in ANSI C, Tata McGraw-Hill.',
        'Brian W. Kernighan and Dennis M. Ritchie, The C Programming Language, Prentice Hall of India.'
      ]
    },
    {
      id: 'ES-EC201',
      code: 'ES-EC201',
      name: 'Basic Electronics Engineering',
      semester: 'Semester II',
      courseType: 'Theory',
      credits: 3,
      ltp: '3-0-0',
      contactHours: 36,
      description: 'Semiconductor diode characteristics, half/full wave rectifiers, BJT biasing & configurations, Operational Amplifiers (Op-Amp 741), and basic digital logic gates.',
      courseOutcomes: [
        { code: 'CO1', desc: 'Analyze PN junction diode V-I characteristics, Zener voltage regulation, and rectifier filters.', bloom: 'L4 Analyze' },
        { code: 'CO2', desc: 'Evaluate Bipolar Junction Transistor (BJT) in CE, CB, CC configurations and DC load line biasing.', bloom: 'L5 Evaluate' },
        { code: 'CO3', desc: 'Design operational amplifier circuits for inverting, non-inverting, summing, and integrator operations.', bloom: 'L6 Create' },
        { code: 'CO4', desc: 'Implement combinational boolean logic expressions using basic and universal logic gates.', bloom: 'L3 Apply' }
      ],
      modules: [
        {
          moduleNumber: 1,
          title: 'Module I · Semiconductor Diodes & Applications',
          hours: 10,
          topics: [
            'P-N junction diode, I-V characteristics, Ideal versus Practical diode, Diode resistance, Temperature dependence',
            'Diode Applications: Half-wave and Full-wave rectifiers (Center-tapped and Bridge), Capacitor filter, Ripple factor and efficiency calculations',
            'Zener diode characteristics, Zener as a voltage regulator; Brief introduction to LED, Photodiode, and Solar Cell'
          ]
        },
        {
          moduleNumber: 2,
          title: 'Module II · Bipolar Junction Transistors (BJT)',
          hours: 10,
          topics: [
            'BJT structure, operation, Common Base (CB), Common Emitter (CE), Common Collector (CC) configurations, Input and Output characteristics, Current gains (alpha, beta, gamma)',
            'Transistor Biasing: Operating point (Q-point), Fixed bias, Collector-to-base bias, Voltage divider self-bias circuit, Thermal runaway and stability factor'
          ]
        },
        {
          moduleNumber: 3,
          title: 'Module III · Operational Amplifiers (Op-Amps)',
          hours: 8,
          topics: [
            'Ideal Op-Amp characteristics, Virtual ground concept, Inverting and Non-inverting amplifier configurations',
            'Op-Amp applications: Voltage follower, Summing amplifier, Difference amplifier, Differentiator, Integrator, Comparator'
          ]
        },
        {
          moduleNumber: 4,
          title: 'Module IV · Digital Electronics Fundamentals',
          hours: 8,
          topics: [
            'Binary number system, Boolean algebra, De Morgan’s Theorems, Logic gates: AND, OR, NOT, NAND, NOR, XOR, XNOR',
            'Universal gates implementation of basic logic functions; Combinational circuit design: Half Adder and Full Adder'
          ]
        }
      ],
      books: [
        'Boylestad and Nashelsky, Electronic Devices and Circuit Theory, Pearson Education.',
        'Sedra and Smith, Microelectronic Circuits, Oxford University Press.',
        'Morris Mano, Digital Logic and Computer Design, Prentice Hall.'
      ]
    },
    // PRACTICALS SEMESTER II
    {
      id: 'ES-CS191',
      code: 'ES-CS191',
      name: 'Programming for Problem Solving Laboratory',
      semester: 'Semester II',
      courseType: 'Practical',
      credits: 1.5,
      ltp: '0-0-3',
      contactHours: 36,
      description: 'Hands-on laboratory programming assignments in C covering data structures, sorting algorithms, recursion, and file manipulation.',
      experiments: [
        { num: 1, title: 'Control Flow & Conditionals', desc: 'C programs for quadratic equation root finding, leap year verification, and nested if-else switch grading.' },
        { num: 2, title: 'Loops & Pattern Generation', desc: 'Prime number verification, Fibonacci series generation, Armstrong number checks, and Pascal triangle printing.' },
        { num: 3, title: 'Array Manipulation & Matrix Operations', desc: '1D array element insertion/deletion, linear search, binary search, and 2D matrix multiplication.' },
        { num: 4, title: 'String Handling Functions', desc: 'Custom implementation of strlen, strcpy, strcat, strcmp, and palindrome verification without library functions.' },
        { num: 5, title: 'Recursive Algorithms', desc: 'Recursive computation of Factorial, GCD (Euclid algorithm), and Tower of Hanoi disk movement.' },
        { num: 6, title: 'Structures & Student Database Management', desc: 'C program storing student roll number, name, marks array using array of structures with file saving.' }
      ]
    },
    {
      id: 'BS-CH191',
      code: 'BS-CH191',
      name: 'Chemistry – I Laboratory',
      semester: 'Semester II',
      courseType: 'Practical',
      credits: 1.5,
      ltp: '0-0-3',
      contactHours: 36,
      description: 'Quantitative volumetric and instrumental chemical analysis experiments.',
      experiments: [
        { num: 1, title: 'Conductometric Titration', desc: 'Determination of strength of strong acid (HCl) by conductometric titration against standard NaOH solution.' },
        { num: 2, title: 'pH-Metric Titration', desc: 'Determination of dissociation constant of weak acid (CH3COOH) by pH measurement.' },
        { num: 3, title: 'Hardness of Water Sample', desc: 'Determination of total, permanent, and temporary hardness of water sample by complexometric EDTA titration.' },
        { num: 4, title: 'Viscosity of Liquid', desc: 'Determination of viscosity of unknown organic liquid using Ostwald\'s viscometer.' },
        { num: 5, title: 'Surface Tension of Liquids', desc: 'Measurement of surface tension of liquid using stalagmometer by drop weight method.' }
      ]
    },
    {
      id: 'ES-ME192',
      code: 'ES-ME192',
      name: 'Workshop / Manufacturing Practices',
      semester: 'Semester II',
      courseType: 'Practical',
      credits: 3,
      ltp: '1-0-4',
      contactHours: 60,
      description: 'Practical training in manufacturing processes: Fitting shop, Carpentry shop, Welding shop, Sheet metal shop, and 3D additive printing.',
      experiments: [
        { num: 1, title: 'Fitting Shop Practice', desc: 'Filing, sawing, chipping, marking, drilling, and tapping to fabricate a mild steel square/V-fit joint.' },
        { num: 2, title: 'Carpentry & Wood Working', desc: 'Planning, chiseling, mortise and tenon joint, cross-lap joint fabrication from seasoned timber.' },
        { num: 3, title: 'Welding Shop Practice', desc: 'Manual Metal Arc Welding (MMAW) and Oxy-acetylene gas welding for butt and lap joint fabrication.' },
        { num: 4, title: 'Sheet Metal & Soldering', desc: 'Development of surfaces, shearing, bending, and seam joint soldering to fabricate a rectangular tray/funnel.' },
        { num: 5, title: 'Additive Manufacturing Demo', desc: 'Introduction to Fused Deposition Modeling (FDM) 3D printing and CAD slicing software.' }
      ]
    }
  ]
};
